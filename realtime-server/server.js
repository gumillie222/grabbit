const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const OpenAI = require("openai");

require("dotenv").config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`[REQUEST] Origin: ${req.headers.origin || 'none'}`);
  next();
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- In-memory storage for users, friends, friend requests, and events ---
// In production, use a database (MongoDB, PostgreSQL, etc.)
const users = new Map(); // userId -> { id, name, email, phone, socketId, online }
const friendRequests = new Map(); // requestId -> { id, fromUserId, toUserId, status: 'pending'|'accepted'|'declined', createdAt }
const friendships = new Map(); // `${userId1}_${userId2}` -> { userId1, userId2, createdAt }
const events = new Map(); // eventId -> { id, title, items, participants, ownerId, sharedWith, createdAt, updatedAt }
const FRIENDSGIVING_EVENT_ID = 'friendsgiving_default';
const ROOMMATES_EVENT_ID = 'roommates_602_default';

// Helper to get user by socket ID
const getUserBySocketId = (socketId) => {
  for (const [userId, user] of users.entries()) {
    if (user.socketId === socketId) return { userId, user };
  }
  return null;
};

// --- Realtime socket logic (enhanced with user support) ---
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  const room = socket.handshake.query.room || "default";
  
  console.log(`[Socket] New connection: userId=${userId}, room=${room}, socketId=${socket.id}`);

  // Register user if userId provided
  if (userId) {
    const existingUser = users.get(userId);
    if (existingUser) {
      existingUser.socketId = socket.id;
      existingUser.online = true;
      existingUser.lastSeen = Date.now();
    } else {
      // New user - should have been registered via /api/users/register
      users.set(userId, {
        id: userId,
        socketId: socket.id,
        online: true,
        lastSeen: Date.now(),
      });
    }
    
    // Try to auto-friend Alice and Bob when they connect
    autoFriendAliceAndBob(userId);
    
    // Ensure default events exist
    ensureDefaultEvents();
    
    // Notify friends that user is online
    notifyFriendsPresence(userId, true);
  }

  socket.join(room);

  // Existing room-based update (for backward compatibility)
  socket.on("update", (payload) => {
    io.to(room).emit("update", { ...payload, serverTs: Date.now() });
  });

  socket.on("ping", (clientTs) => {
    socket.emit("pong", { clientTs, serverTs: Date.now() });
  });

  // User-based event update (for events shared between users)
  socket.on("event:update", (payload) => {
    const { eventId, eventData } = payload;
    
    if (!eventId || !eventData) {
      console.error('[Socket] Invalid event:update payload');
      return;
    }
    
    // Update event in storage
    const existingEvent = events.get(eventId);
    if (existingEvent) {
      const ownerId = existingEvent.ownerId || userId;
      
      // If participants are being updated, resolve them to user IDs and update sharedWith
      let sharedWith = existingEvent.sharedWith || [ownerId];
      const oldSharedWith = [...sharedWith];
      
      if (eventData.participants) {
        // Use resolved IDs as the source of truth (same logic as POST endpoint)
        const resolvedIds = resolveParticipantNamesToUserIds(eventData.participants, ownerId);
        sharedWith = resolvedIds;
        console.log(`[Socket] Resolved participants to user IDs: ${eventData.participants} -> ${resolvedIds.join(', ')}`);
        console.log(`[Socket] Updated sharedWith: ${oldSharedWith.join(', ')} -> ${sharedWith.join(', ')}`);
      }
      
      // Ensure owner is always in sharedWith
      if (!sharedWith.includes(ownerId)) {
        sharedWith.unshift(ownerId);
      }
      
      const wasSharedWithUpdated = JSON.stringify(oldSharedWith.sort()) !== JSON.stringify(sharedWith.sort());
      
      // Convert item names to user IDs before storing
      const itemsWithUserIds = eventData.items 
        ? convertItemNamesToUserIds(eventData.items, ownerId)
        : existingEvent.items;
      
      events.set(eventId, {
        ...existingEvent,
        ...eventData,
        items: itemsWithUserIds, // Use converted items with user IDs
        sharedWith: sharedWith,
        updatedAt: Date.now(),
      });
      
      // If sharedWith was updated, notify both newly added and removed users
      if (wasSharedWithUpdated) {
        const newlyAddedUsers = sharedWith.filter(uid => !oldSharedWith.includes(uid));
        const removedUsers = oldSharedWith.filter(uid => !sharedWith.includes(uid));
        
        // Notify newly added users to reload their event list
        newlyAddedUsers.forEach(targetUserId => {
          const targetUser = users.get(targetUserId);
          if (targetUser && targetUser.socketId) {
            io.to(targetUser.socketId).emit("events:reload");
            console.log(`[Socket] Sent events:reload to newly added user ${targetUserId} for event ${eventId}`);
          }
        });
        
        // Notify removed users to reload their event list (so they stop seeing the event)
        removedUsers.forEach(targetUserId => {
          const targetUser = users.get(targetUserId);
          if (targetUser && targetUser.socketId) {
            io.to(targetUser.socketId).emit("events:reload");
            console.log(`[Socket] Sent events:reload to removed user ${targetUserId} for event ${eventId}`);
          }
        });
      }
      
      // Notify all users who have access to this event
      sharedWith.forEach(targetUserId => {
        if (targetUserId !== userId) { // Don't send back to sender
          const targetUser = users.get(targetUserId);
          if (targetUser && targetUser.socketId) {
            const eventToSend = events.get(eventId);
            // Convert item user IDs to names for the receiving user
            const eventDataForUser = {
              ...eventToSend,
              items: convertItemUserIdsToNames(eventToSend.items || [], targetUserId),
            };
            io.to(targetUser.socketId).emit("event:update", {
              eventId,
              eventData: eventDataForUser,
              fromUserId: userId,
              serverTs: Date.now(),
            });
          }
        }
      });
      
      console.log(`[Socket] Event updated: ${eventId} by ${userId}, sharedWith: ${sharedWith.join(', ')}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnect: socketId=${socket.id}`);
    if (userId) {
      const user = users.get(userId);
      if (user) {
        user.online = false;
        user.lastSeen = Date.now();
        // Notify friends that user is offline
        notifyFriendsPresence(userId, false);
      }
    }
  });
});

// Helper to notify friends about presence changes
function notifyFriendsPresence(userId, isOnline) {
  // Find all friendships for this user
  for (const [key, friendship] of friendships.entries()) {
    let friendId = null;
    if (friendship.userId1 === userId) {
      friendId = friendship.userId2;
    } else if (friendship.userId2 === userId) {
      friendId = friendship.userId1;
    }
    
    if (friendId) {
      const friend = users.get(friendId);
      if (friend && friend.socketId) {
        io.to(friend.socketId).emit("friend:presence", {
          userId,
          online: isOnline,
        });
      }
    }
  }
}

// --- NEW AI suggestion endpoint ---
// Only initialize OpenAI client if API key is provided
let client = null;
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("[AI] OpenAI client initialized");
} else {
  console.warn("[AI] WARNING: OPENAI_API_KEY not set. AI suggestions will be disabled.");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Debug endpoint to check server state
app.get("/api/debug", (req, res) => {
  const userList = Array.from(users.entries()).map(([id, user]) => ({
    id,
    name: user.name,
    email: user.email,
    online: user.online,
  }));
  
  const friendshipList = Array.from(friendships.entries()).map(([key, f]) => ({
    key,
    userId1: f.userId1,
    userId2: f.userId2,
  }));
  
  const eventList = Array.from(events.entries()).map(([id, e]) => {
    const owner = users.get(e.ownerId);
    const sharedWithUsers = (e.sharedWith || []).map(uid => {
      const user = users.get(uid);
      return {
        userId: uid,
        name: user?.name || 'Unknown',
        email: user?.email || '',
        online: user?.online || false,
      };
    });
    return {
      id,
      title: e.title,
      ownerId: e.ownerId,
      ownerName: owner?.name || 'Unknown',
      participants: e.participants || [],
      sharedWith: e.sharedWith || [],
      sharedWithUsers: sharedWithUsers,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  });
  
  res.json({
    users: userList,
    friendships: friendshipList,
    events: eventList,
    totalUsers: users.size,
    totalFriendships: friendships.size,
    totalEvents: events.size,
  });
});

// --- User Management Endpoints ---

// Helper to auto-friend Alice and Bob
const autoFriendAliceAndBob = (userId) => {
  // Find Alice and Bob by email
  let aliceId = null;
  let bobId = null;
  
  for (const [uid, user] of users.entries()) {
    if (user.email === 'alice@example.com') aliceId = uid;
    if (user.email === 'bob@example.com') bobId = uid;
  }
  
  // If we have both Alice and Bob, make them friends
  if (aliceId && bobId) {
    const friendshipKey1 = `${aliceId}_${bobId}`;
    const friendshipKey2 = `${bobId}_${aliceId}`;
    
    if (!friendships.has(friendshipKey1) && !friendships.has(friendshipKey2)) {
      friendships.set(friendshipKey1, {
        userId1: aliceId,
        userId2: bobId,
        createdAt: Date.now(),
      });
      console.log(`[API] Auto-friended Alice and Bob (${aliceId} <-> ${bobId})`);
      
      // Notify both users (even if they're not connected yet, they'll get it when they connect)
      const alice = users.get(aliceId);
      const bob = users.get(bobId);
      
      if (alice && alice.socketId) {
        io.to(alice.socketId).emit("friend:accepted", {
          friendId: bobId,
          friend: bob ? { id: bob.id, name: bob.name, email: bob.email, phone: bob.phone, online: bob.online } : null,
        });
        // Also trigger event reload for Alice
        io.to(alice.socketId).emit("events:reload");
      }
      
      if (bob && bob.socketId) {
        io.to(bob.socketId).emit("friend:accepted", {
          friendId: aliceId,
          friend: alice ? { id: alice.id, name: alice.name, email: alice.email, phone: alice.phone, online: alice.online } : null,
        });
        // Also trigger event reload for Bob
        io.to(bob.socketId).emit("events:reload");
      }
      
      return true; // Friendship created
    }
  }
  return false; // No friendship created
};

// Helper to find user IDs by email
const findUserIdsByEmail = () => {
  let aliceId = null;
  let bobId = null;
  
  for (const [uid, user] of users.entries()) {
    if (user.email === 'alice@example.com') {
      aliceId = uid;
    }
    if (user.email === 'bob@example.com') {
      bobId = uid;
    }
  }
  
  return { aliceId, bobId };
};

// Helper to update sharedWith in existing events when new user logs in
const updateEventSharedWith = () => {
  const { aliceId, bobId } = findUserIdsByEmail();
  
  // Also check if 'alice' and 'bob' IDs exist directly (as fallback)
  const directAliceId = users.has('alice') ? 'alice' : aliceId;
  const directBobId = users.has('bob') ? 'bob' : bobId;
  
  const finalAliceId = directAliceId || aliceId;
  const finalBobId = directBobId || bobId;
  
  console.log(`[API] updateEventSharedWith: aliceId=${finalAliceId}, bobId=${finalBobId}`);
  
  // Update existing events to include available user IDs
  for (const [eventId, event] of events.entries()) {
    if (eventId === FRIENDSGIVING_EVENT_ID || eventId === ROOMMATES_EVENT_ID) {
      const sharedWith = event.sharedWith || [];
      let updated = false;
      const newlyAddedUsers = [];
      
      if (finalAliceId && !sharedWith.includes(finalAliceId)) {
        sharedWith.push(finalAliceId);
        updated = true;
        newlyAddedUsers.push(finalAliceId);
      }
      if (finalBobId && !sharedWith.includes(finalBobId)) {
        sharedWith.push(finalBobId);
        updated = true;
        newlyAddedUsers.push(finalBobId);
      }
      
      if (updated) {
        event.sharedWith = sharedWith;
        event.updatedAt = Date.now();
        console.log(`[API] Updated event ${eventId} sharedWith to include ${sharedWith.join(', ')}`);
        
        // Notify newly added users to reload events
        newlyAddedUsers.forEach(userId => {
          const user = users.get(userId);
          if (user && user.socketId) {
            io.to(user.socketId).emit("events:reload");
            console.log(`[API] Notified user ${userId} to reload events after being added to ${eventId}`);
          }
        });
      } else {
        console.log(`[API] Event ${eventId} sharedWith already includes both users: ${sharedWith.join(', ')}`);
      }
    }
  }
};

// Helper to create default events (Friendsgiving and Roommates 602)
const ensureDefaultEvents = () => {
  // Find Alice and Bob by email
  const { aliceId, bobId } = findUserIdsByEmail();
  
  // Also check if 'alice' and 'bob' IDs exist directly (as fallback)
  const directAliceId = users.has('alice') ? 'alice' : aliceId;
  const directBobId = users.has('bob') ? 'bob' : bobId;
  
  const finalAliceId = directAliceId || aliceId;
  const finalBobId = directBobId || bobId;
  
  console.log(`[API] ensureDefaultEvents: checking ${users.size} users (aliceId=${finalAliceId}, bobId=${finalBobId})`);
  
  // If we don't have both users yet, we can still create events with placeholder IDs
  // They'll be updated when the second user comes online
  if (!finalAliceId && !finalBobId) {
    console.log(`[API] Cannot create default events: need at least Alice or Bob`);
    return false;
  }
  
  // Use available user IDs
  const ownerId = finalAliceId || finalBobId;
  const alice = finalAliceId ? users.get(finalAliceId) : null;
  const bob = finalBobId ? users.get(finalBobId) : null;
  
  // Build sharedWith array - always include both Alice and Bob if they exist
  const sharedWith = [];
  if (finalAliceId) {
    sharedWith.push(finalAliceId);
  }
  if (finalBobId && !sharedWith.includes(finalBobId)) {
    sharedWith.push(finalBobId);
  }
  // If no users found yet, at least include the owner
  if (sharedWith.length === 0 && ownerId) {
    sharedWith.push(ownerId);
  }
  
  console.log(`[API] ensureDefaultEvents: sharedWith will be [${sharedWith.join(', ')}]`);
  
  let eventsCreated = false;
  
  // Create Friendsgiving event if it doesn't exist
  if (!events.has(FRIENDSGIVING_EVENT_ID)) {
    const friendsgivingEvent = {
      id: FRIENDSGIVING_EVENT_ID,
      title: 'Friendsgiving',
      items: [
        { id: 1, name: 'dish soap', urgent: true, claimedBy: alice?.name || 'Alice', bought: false, price: null },
        { id: 2, name: 'paper towel', urgent: false, claimedBy: null, bought: false, price: null },
        { id: 3, name: 'flower', urgent: true, claimedBy: null, bought: false, price: null },
        { id: 4, name: 'milk 2%', urgent: true, claimedBy: alice?.name || 'Alice', bought: false, price: null },
      ],
      participants: [alice?.name || 'Alice', bob?.name || 'Bob'],
      ownerId: ownerId,
      sharedWith: sharedWith,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    events.set(FRIENDSGIVING_EVENT_ID, friendsgivingEvent);
    console.log(`[API] Created default Friendsgiving event (shared with ${sharedWith.join(', ')})`);
    eventsCreated = true;
  }
  
  // Create Roommates 602 event if it doesn't exist
  if (!events.has(ROOMMATES_EVENT_ID)) {
    const roommatesEvent = {
      id: ROOMMATES_EVENT_ID,
      title: 'Unit 602 Roommates!',
      items: [
        { id: 1, name: 'dish soap', urgent: true, claimedBy: alice?.name || 'Alice', bought: false, price: null },
        { id: 2, name: 'paper towel', urgent: false, claimedBy: null, bought: false, price: null },
        { id: 3, name: 'flower', urgent: true, claimedBy: null, bought: false, price: null },
        { id: 4, name: 'milk 2%', urgent: true, claimedBy: alice?.name || 'Alice', bought: false, price: null },
      ],
      participants: [alice?.name || 'Alice', bob?.name || 'Bob'],
      ownerId: ownerId,
      sharedWith: sharedWith,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    events.set(ROOMMATES_EVENT_ID, roommatesEvent);
    console.log(`[API] Created default Unit 602 Roommates event (shared with ${sharedWith.join(', ')})`);
    eventsCreated = true;
  }
  
  // Always update sharedWith for existing events to ensure both users are included
  updateEventSharedWith();
  
  // If events were created or updated, notify online users to reload
  const aliceUser = finalAliceId ? users.get(finalAliceId) : null;
  const bobUser = finalBobId ? users.get(finalBobId) : null;
  
  if (eventsCreated) {
    // Notify any online users
    if (aliceUser?.socketId) {
      io.to(aliceUser.socketId).emit("events:reload");
      console.log(`[API] Notified Alice to reload events`);
    }
    if (bobUser?.socketId) {
      io.to(bobUser.socketId).emit("events:reload");
      console.log(`[API] Notified Bob to reload events`);
    }
    
    // Also notify the owner if they're online
    const ownerUser = users.get(ownerId);
    if (ownerUser?.socketId && ownerUser.socketId !== aliceUser?.socketId && ownerUser.socketId !== bobUser?.socketId) {
      io.to(ownerUser.socketId).emit("events:reload");
      console.log(`[API] Notified owner to reload events`);
    }
  }
  
  return eventsCreated;
};

// Register/Update user
app.post("/api/users/register", (req, res) => {
  const { id, name, email, phone } = req.body;
  
  if (!id || !name) {
    return res.status(400).json({ error: "id and name are required" });
  }

  const existingUser = users.get(id);
  const userData = {
    id,
    name,
    email: email || '',
    phone: phone || '',
    online: existingUser?.online || false,
    socketId: existingUser?.socketId || null,
    lastSeen: existingUser?.lastSeen || Date.now(),
  };

  users.set(id, userData);
  console.log(`[API] Registered user: ${id} (${name}, email: ${email})`);
  
  // Auto-friend Alice and Bob (this will work even if only one is registered - it will trigger when second one registers)
  const friendshipCreated = autoFriendAliceAndBob(id);
  
  // Ensure default events exist (Friendsgiving and Roommates 602)
  const eventsCreated = ensureDefaultEvents();
  
  if (friendshipCreated || eventsCreated) {
    console.log(`[API] Auto-setup completed: friendship=${friendshipCreated}, events=${eventsCreated}`);
  }
  
  res.json({ user: userData });
});

// Get user info
app.get("/api/users/:userId", (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  // Don't expose socketId to client
  const { socketId, ...publicUser } = user;
  res.json({ user: publicUser });
});

// Search users by email or phone
app.post("/api/users/search", (req, res) => {
  const { email, phone } = req.body;
  
  if (!email && !phone) {
    return res.status(400).json({ error: "email or phone is required" });
  }

  const results = [];
  for (const [userId, user] of users.entries()) {
    if ((email && user.email === email) || (phone && user.phone === phone)) {
      const { socketId, ...publicUser } = user;
      results.push(publicUser);
    }
  }
  
  res.json({ users: results });
});

// --- Friend Request Endpoints ---

// Send friend request
app.post("/api/friends/request", (req, res) => {
  const { fromUserId, toUserId } = req.body;
  
  if (!fromUserId || !toUserId) {
    return res.status(400).json({ error: "fromUserId and toUserId are required" });
  }

  if (fromUserId === toUserId) {
    return res.status(400).json({ error: "Cannot send friend request to yourself" });
  }

  // Check if already friends
  const friendshipKey1 = `${fromUserId}_${toUserId}`;
  const friendshipKey2 = `${toUserId}_${fromUserId}`;
  if (friendships.has(friendshipKey1) || friendships.has(friendshipKey2)) {
    return res.status(400).json({ error: "Already friends" });
  }

  // Check if pending request exists
  for (const [reqId, req] of friendRequests.entries()) {
    if (
      req.status === 'pending' &&
      ((req.fromUserId === fromUserId && req.toUserId === toUserId) ||
       (req.fromUserId === toUserId && req.toUserId === fromUserId))
    ) {
      return res.status(400).json({ error: "Friend request already pending" });
    }
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const request = {
    id: requestId,
    fromUserId,
    toUserId,
    status: 'pending',
    createdAt: Date.now(),
  };

  friendRequests.set(requestId, request);
  
  // Notify recipient via socket
  const toUser = users.get(toUserId);
  if (toUser && toUser.socketId) {
    const fromUser = users.get(fromUserId);
    io.to(toUser.socketId).emit("friend:request", {
      requestId,
      fromUser: fromUser ? { id: fromUser.id, name: fromUser.name, email: fromUser.email, phone: fromUser.phone } : null,
      createdAt: request.createdAt,
    });
  }

  console.log(`[API] Friend request sent: ${fromUserId} -> ${toUserId}`);
  res.json({ request });
});

// Get friend requests for a user
app.get("/api/friends/requests/:userId", (req, res) => {
  const { userId } = req.params;
  
  const sent = [];
  const received = [];
  
  for (const [reqId, req] of friendRequests.entries()) {
    if (req.fromUserId === userId) {
      const toUser = users.get(req.toUserId);
      sent.push({
        ...req,
        toUser: toUser ? { id: toUser.id, name: toUser.name, email: toUser.email, phone: toUser.phone } : null,
      });
    } else if (req.toUserId === userId) {
      const fromUser = users.get(req.fromUserId);
      received.push({
        ...req,
        fromUser: fromUser ? { id: fromUser.id, name: fromUser.name, email: fromUser.email, phone: fromUser.phone } : null,
      });
    }
  }
  
  res.json({ sent, received });
});

// Accept friend request
app.post("/api/friends/accept", (req, res) => {
  const { requestId, userId } = req.body;
  
  if (!requestId || !userId) {
    return res.status(400).json({ error: "requestId and userId are required" });
  }

  const request = friendRequests.get(requestId);
  if (!request) {
    return res.status(404).json({ error: "Friend request not found" });
  }

  if (request.toUserId !== userId) {
    return res.status(403).json({ error: "Not authorized to accept this request" });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({ error: "Request already processed" });
  }

  request.status = 'accepted';
  
  // Create friendship
  const friendshipKey = `${request.fromUserId}_${request.toUserId}`;
  friendships.set(friendshipKey, {
    userId1: request.fromUserId,
    userId2: request.toUserId,
    createdAt: Date.now(),
  });

  // Notify both users
  const fromUser = users.get(request.fromUserId);
  const toUser = users.get(request.toUserId);
  
  if (fromUser && fromUser.socketId) {
    io.to(fromUser.socketId).emit("friend:accepted", {
      requestId,
      friendId: request.toUserId,
      friend: toUser ? { id: toUser.id, name: toUser.name, email: toUser.email, phone: toUser.phone, online: toUser.online } : null,
    });
  }
  
  if (toUser && toUser.socketId) {
    io.to(toUser.socketId).emit("friend:accepted", {
      requestId,
      friendId: request.fromUserId,
      friend: fromUser ? { id: fromUser.id, name: fromUser.name, email: fromUser.email, phone: fromUser.phone, online: fromUser.online } : null,
    });
  }

  console.log(`[API] Friend request accepted: ${request.fromUserId} <-> ${request.toUserId}`);
  res.json({ success: true, friendship: friendships.get(friendshipKey) });
});

// Decline friend request
app.post("/api/friends/decline", (req, res) => {
  const { requestId, userId } = req.body;
  
  if (!requestId || !userId) {
    return res.status(400).json({ error: "requestId and userId are required" });
  }

  const request = friendRequests.get(requestId);
  if (!request) {
    return res.status(404).json({ error: "Friend request not found" });
  }

  if (request.toUserId !== userId) {
    return res.status(403).json({ error: "Not authorized to decline this request" });
  }

  request.status = 'declined';
  
  // Notify sender
  const fromUser = users.get(request.fromUserId);
  if (fromUser && fromUser.socketId) {
    io.to(fromUser.socketId).emit("friend:declined", {
      requestId,
      toUserId: request.toUserId,
    });
  }

  console.log(`[API] Friend request declined: ${request.fromUserId} -> ${request.toUserId}`);
  res.json({ success: true });
});

// Get friends list
app.get("/api/friends/:userId", (req, res) => {
  const { userId } = req.params;
  
  console.log(`[API] GET /api/friends/${userId} - Total friendships: ${friendships.size}`);
  
  // Try to auto-friend Alice and Bob
  autoFriendAliceAndBob(userId);
  
  const friends = [];
  for (const [key, friendship] of friendships.entries()) {
    let friendId = null;
    if (friendship.userId1 === userId) {
      friendId = friendship.userId2;
    } else if (friendship.userId2 === userId) {
      friendId = friendship.userId1;
    }
    
    if (friendId) {
      const friend = users.get(friendId);
      if (friend) {
        const { socketId, ...publicFriend } = friend;
        friends.push(publicFriend);
      }
    }
  }
  
  console.log(`[API] Returning ${friends.length} friends for user ${userId}`);
  res.json({ friends });
});

// --- Event Endpoints ---

// Get events for a user
app.get("/api/events/:userId", (req, res) => {
  const { userId } = req.params;
  
  console.log(`[API] GET /api/events/${userId} - Total events in storage: ${events.size}`);
  
  // Update existing events to include this user if they're Alice or Bob
  updateEventSharedWith();
  
  // Try to ensure default events exist before returning
  const eventsCreated = ensureDefaultEvents();
  if (eventsCreated) {
    console.log(`[API] Default events were just created`);
  }
  
  const userEvents = [];
  for (const [eventId, event] of events.entries()) {
    // Include events owned by user or shared with user
    if (event.ownerId === userId || (event.sharedWith && event.sharedWith.includes(userId))) {
      console.log(`[API] Event ${eventId} matches user ${userId}`);
      
      // Convert item user IDs to names for display
      const eventForUser = {
        ...event,
        items: convertItemUserIdsToNames(event.items || [], userId),
      };
      
      userEvents.push(eventForUser);
    } else {
      console.log(`[API] Event ${eventId} does NOT match: ownerId=${event.ownerId}, sharedWith=${JSON.stringify(event.sharedWith)}, userId=${userId}`);
    }
  }
  
  console.log(`[API] Returning ${userEvents.length} events for user ${userId}:`, userEvents.map(e => e.title));
  res.json({ events: userEvents });
});

// Get a specific event
app.get("/api/events/:userId/:eventId", (req, res) => {
  const { userId, eventId } = req.params;
  
  const event = events.get(eventId);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  
  // Check if user has access
  if (event.ownerId !== userId && (!event.sharedWith || !event.sharedWith.includes(userId))) {
    return res.status(403).json({ error: "Not authorized to access this event" });
  }
  
  // Convert item user IDs to names for display
  const eventForUser = {
    ...event,
    items: convertItemUserIdsToNames(event.items || [], userId),
  };
  
  res.json({ event: eventForUser });
});

// Helper to resolve participant names to user IDs
const resolveParticipantNamesToUserIds = (participants, ownerId) => {
  const resolvedIds = [ownerId]; // Always include owner
  
  // Get owner's name for "Me" resolution
  const owner = users.get(ownerId);
  const ownerName = owner?.name;
  
  // Find user IDs for participants by name
  for (const participantName of participants || []) {
    // Skip if it's "Me" (which should be the owner) or if it's already the owner ID
    if (participantName === 'Me' || participantName === ownerId || participantName === ownerName) {
      continue; // Already included as owner
    }
    
    // Search for user by name (case-insensitive)
    let found = false;
    for (const [uid, user] of users.entries()) {
      // Case-insensitive name matching
      if (user.name && user.name.toLowerCase() === participantName.toLowerCase() && uid !== ownerId) {
        if (!resolvedIds.includes(uid)) {
          resolvedIds.push(uid);
          console.log(`[API] Resolved participant "${participantName}" to user ID: ${uid} (${user.name})`);
          found = true;
        }
        break;
      }
    }
    
    if (!found) {
      console.warn(`[API] WARNING: Could not resolve participant "${participantName}" to a user ID. Available users:`, 
        Array.from(users.entries()).map(([uid, u]) => `${u.name} (${uid})`).join(', '));
    }
  }
  
  return resolvedIds;
};

// Helper to convert a name to user ID (for items: claimedBy, sharedBy)
const resolveNameToUserId = (name, ownerId) => {
  if (!name) return null;
  
  // Get owner's name for "Me" resolution
  const owner = users.get(ownerId);
  const ownerName = owner?.name;
  
  // If it's "Me" or matches owner's name, return owner ID
  if (name === 'Me' || name === ownerId || name === ownerName) {
    return ownerId;
  }
  
  // Search for user by name (case-insensitive)
  for (const [uid, user] of users.entries()) {
    if (user.name && user.name.toLowerCase() === name.toLowerCase()) {
      return uid;
    }
  }
  
  // If not found, return null (will be handled by caller)
  return null;
};

// Helper to convert user ID to name (for display)
const resolveUserIdToName = (userId, currentUserId) => {
  if (!userId) return null;
  
  // If it's the current user, return "Me"
  if (userId === currentUserId) {
    return 'Me';
  }
  
  // Get user by ID
  const user = users.get(userId);
  return user?.name || null;
};

// Helper to convert item names to user IDs
const convertItemNamesToUserIds = (items, ownerId) => {
  if (!Array.isArray(items)) return items;
  
  return items.map(item => {
    const converted = { ...item };
    
    // Convert claimedBy
    if (item.claimedBy) {
      const userId = resolveNameToUserId(item.claimedBy, ownerId);
      converted.claimedBy = userId;
    }
    
    // Convert sharedBy array
    if (Array.isArray(item.sharedBy) && item.sharedBy.length > 0) {
      converted.sharedBy = item.sharedBy
        .map(name => resolveNameToUserId(name, ownerId))
        .filter(id => id !== null); // Remove any that couldn't be resolved
    }
    
    return converted;
  });
};

// Helper to convert item user IDs to names
const convertItemUserIdsToNames = (items, currentUserId) => {
  if (!Array.isArray(items)) return items;
  
  return items.map(item => {
    const converted = { ...item };
    
    // Convert claimedBy
    if (item.claimedBy) {
      const name = resolveUserIdToName(item.claimedBy, currentUserId);
      converted.claimedBy = name || null;
    }
    
    // Convert sharedBy array
    if (Array.isArray(item.sharedBy) && item.sharedBy.length > 0) {
      converted.sharedBy = item.sharedBy
        .map(userId => resolveUserIdToName(userId, currentUserId))
        .filter(name => name !== null); // Remove any that couldn't be resolved
    }
    
    return converted;
  });
};

// Create or update event
app.post("/api/events", (req, res) => {
  const { userId, eventId, eventData } = req.body;
  
  if (!userId || !eventData) {
    return res.status(400).json({ error: "userId and eventData are required" });
  }
  
  const eventIdToUse = eventId || `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const existingEvent = events.get(eventIdToUse);
  
  // Always resolve participants to user IDs first (for both new and existing events)
  // This ensures sharedWith is always correct based on participants
  let sharedWith = [userId]; // Start with owner
  
  if (eventData.participants) {
    const resolvedIds = resolveParticipantNamesToUserIds(eventData.participants, userId);
    // Use resolved IDs as the source of truth for sharedWith
    sharedWith = resolvedIds;
    
    console.log(`[API] Resolved participants to user IDs: ${eventData.participants} -> ${resolvedIds.join(', ')}`);
    
    // Log which accounts are involved
    const involvedUsers = sharedWith.map(uid => {
      const user = users.get(uid);
      return user ? `${user.name} (${uid})` : uid;
    });
    console.log(`[API] Event involves ${sharedWith.length} account(s): ${involvedUsers.join(', ')}`);
  } else {
    // If no participants provided, use existing sharedWith or provided sharedWith
    sharedWith = eventData.sharedWith || existingEvent?.sharedWith || [userId];
  }
  
  // Validate: ensure owner is always in sharedWith
  if (!sharedWith.includes(userId)) {
    sharedWith.unshift(userId); // Add owner at the beginning
  }
  
  console.log(`[API] Final sharedWith: ${sharedWith.join(', ')}`);
  
  const event = {
    id: eventIdToUse,
    ...eventData,
    ownerId: existingEvent?.ownerId || userId,
    sharedWith: sharedWith,
    createdAt: existingEvent?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  
  events.set(eventIdToUse, event);
  
  // Notify all users who have access to this event
  const isNewEvent = !existingEvent;
  const wasSharedWithUpdated = existingEvent && 
    JSON.stringify((existingEvent.sharedWith || []).sort()) !== JSON.stringify(sharedWith.sort());
  
  // If sharedWith was updated, notify both newly added and removed users
  if (wasSharedWithUpdated) {
    const oldSharedWith = existingEvent.sharedWith || [];
    const newlyAddedUsers = sharedWith.filter(uid => !oldSharedWith.includes(uid));
    const removedUsers = oldSharedWith.filter(uid => !sharedWith.includes(uid));
    
    // Notify newly added users to reload their event list
    newlyAddedUsers.forEach(targetUserId => {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        io.to(targetUser.socketId).emit("events:reload");
        console.log(`[API] Sent events:reload to newly added user ${targetUserId} for event ${eventIdToUse}`);
      }
    });
    
    // Notify removed users to reload their event list (so they stop seeing the event)
    removedUsers.forEach(targetUserId => {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        io.to(targetUser.socketId).emit("events:reload");
        console.log(`[API] Sent events:reload to removed user ${targetUserId} for event ${eventIdToUse}`);
      }
    });
  }
  
  sharedWith.forEach(targetUserId => {
    if (targetUserId !== userId) {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        // For new events or when sharedWith was updated, send events:reload to ensure the client refreshes
        if (isNewEvent || wasSharedWithUpdated) {
          io.to(targetUser.socketId).emit("events:reload");
          console.log(`[API] Sent events:reload to user ${targetUserId} for event ${eventIdToUse}`);
        } else {
          // For regular updates, send event:update
          io.to(targetUser.socketId).emit("event:update", {
            eventId: eventIdToUse,
            eventData: event,
            fromUserId: userId,
            serverTs: Date.now(),
          });
        }
      } else if (isNewEvent || wasSharedWithUpdated) {
        console.log(`[API] User ${targetUserId} is not online, will see event when they connect`);
      }
    }
  });
  
  // Enhanced logging for event creation/sharing
  const owner = users.get(userId);
  const ownerName = owner?.name || userId;
  const sharedWithNames = sharedWith.map(uid => {
    const user = users.get(uid);
    return user ? `${user.name} (${uid})` : uid;
  });
  
  if (existingEvent) {
    console.log(`[API] Event UPDATED: ${eventIdToUse}`);
    console.log(`[API]   - Owner: ${ownerName} (${userId})`);
    console.log(`[API]   - Participants: ${(eventData.participants || event.participants || []).join(', ')}`);
    console.log(`[API]   - Shared with: ${sharedWithNames.join(', ')}`);
  } else {
    console.log(`[API] Event CREATED: ${eventIdToUse}`);
    console.log(`[API]   - Created by: ${ownerName} (${userId})`);
    console.log(`[API]   - Title: ${eventData.title || 'Untitled'}`);
    console.log(`[API]   - Participants: ${(eventData.participants || []).join(', ')}`);
    console.log(`[API]   - Shared with: ${sharedWithNames.join(', ')}`);
    console.log(`[API]   - Total users involved: ${sharedWith.length}`);
  }
  
  res.json({ event });
});

app.post("/api/suggestions", async (req, res) => {
  // Set CORS headers explicitly
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  console.log("[API] POST /api/suggestions called");
  console.log("[API] Request body:", JSON.stringify(req.body));

  // Check if OpenAI client is available
  if (!client) {
    return res.status(503).json({
      error: "AI suggestions are not available. OPENAI_API_KEY is not configured.",
      suggestions: []
    });
  }

  try {
    const { description, pastItems = [] } = req.body;

    // Validate input
    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return res.status(400).json({ 
        error: "Description is required",
        suggestions: [] 
      });
    }
    const messages = [
      {
        role: "system",
        content:
          "You help users build shopping lists for gatherings. " +
          "Given their description and items they already have, " +
          "suggest 8-12 other useful items. " +
          "CRITICAL RULES: " +
          "Each suggestion must be a SINGLE, SPECIFIC item - never use 'OR', 'and/or', or list multiple items. " +
          "Each suggestion should be one specific product/item (e.g., 'Paper Plates', 'Ice', 'Napkins', 'Chips'). " +
          "Return only JSON with a `suggestions` array of strings.",
      },
      {
        role: "user",
        content: `
Gathering: "${description}"
Already have: ${pastItems.join(", ") || "(none)"}
        `,
      },
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: { type: "json_object" },
    });

    const jsonText = completion.choices[0].message.content;
    const data = JSON.parse(jsonText);

    if (!data.suggestions || !Array.isArray(data.suggestions)) {
      throw new Error("Model did not return a suggestions array");
    }

    // Post-process suggestions to ensure each is at most 3 words
    const processedSuggestions = data.suggestions.map(suggestion => {
      if (typeof suggestion !== 'string') {
        suggestion = String(suggestion);
      }
      const words = suggestion.trim().split(/\s+/);
      // Take only first 3 words and join them
      return words.slice(0, 3).join(' ');
    }).filter(suggestion => suggestion.length > 0); // Remove empty suggestions

    console.log(`[AI Response] Generated ${processedSuggestions.length} suggestions (truncated to max 3 words each)`);
    res.json({ suggestions: processedSuggestions });
  } catch (err) {
    console.error("[ERROR] AI suggestion error:", err.message);
    console.error("[ERROR] Error stack:", err.stack);
    
    // Ensure response is sent even on error
    if (!res.headersSent) {
      res.status(500).json({ 
        error: err.message || "Failed to generate suggestions",
        suggestions: [] 
      });
    }
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`Realtime + AI server running on port ${PORT}`)
);