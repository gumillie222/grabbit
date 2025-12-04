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
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- In-memory storage for users, friends, and events ---
// In production, use a database (MongoDB, PostgreSQL, etc.)
const users = new Map(); // userId -> { id, name, email, phone, socketId, online }
const friendships = new Map(); // `${userId1}_${userId2}` -> { userId1, userId2, createdAt }
const events = new Map(); // eventId -> { id, title, items, participants, ownerId, sharedWith, createdAt, updatedAt }
const deletedEvents = new Set(); // Track deleted event IDs to prevent recreation
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
  
  console.log(`[Socket] New connection: userId=${userId}, socketId=${socket.id}`);

  // Allow alice, bob, and dummy users (charlie, david, emma) for demo
  if (userId) {
    // For demo, allow 'alice', 'bob', and dummy users
    const normalizedUserId = userId.toLowerCase();
    const allowedUsers = ['alice', 'bob', 'charlie', 'david', 'emma'];
    if (!allowedUsers.includes(normalizedUserId)) {
      console.log(`[Socket] Rejected connection: userId=${userId} is not in allowed list`);
      socket.disconnect();
      return;
    }
    
    // Get or create user entry
    let user = users.get(normalizedUserId);
    if (!user) {
      // Auto-register users if they don't exist yet
      const userDataMap = {
        'alice': { id: 'alice', name: 'Alice', email: 'alice@grabbit.com', phone: '555-111-2222' },
        'bob': { id: 'bob', name: 'Bob', email: 'bob@grabbit.com', phone: '555-333-4444' },
        'charlie': { id: 'charlie', name: 'Charlie', email: 'charlie@grabbit.com', phone: '555-444-5555' },
        'david': { id: 'david', name: 'David', email: 'david@grabbit.com', phone: '555-666-7777' },
        'emma': { id: 'emma', name: 'Emma', email: 'emma@grabbit.com', phone: '555-888-9999' },
      };
      
      const userData = userDataMap[normalizedUserId];
      if (userData) {
        user = {
          ...userData,
          socketId: socket.id,
          online: true,
          lastSeen: Date.now(),
        };
        users.set(normalizedUserId, user);
        console.log(`[Socket] Auto-registered user: ${normalizedUserId}`);
      }
    } else {
      // Update existing user
      user.socketId = socket.id;
      user.online = true;
      user.lastSeen = Date.now();
    }
    
    ensureAliceAndBobFriendship();
    ensureDefaultEvents();
  }

  // User-based event update (for events shared between users)
  socket.on("event:update", (payload) => {
    const { eventId, eventData } = payload;
    
    if (!eventId || !eventData) {
      console.error('[Socket] Invalid event:update payload');
      return;
    }
    
    // Get current userId from socket (may have changed if user switched accounts)
    const currentUserId = socket.handshake.query.userId || userId;
    const userInfo = getUserBySocketId(socket.id);
    const actualUserId = userInfo?.userId || currentUserId;
    
    console.log(`[Socket] event:update from userId=${actualUserId} (socketId=${socket.id}, query.userId=${socket.handshake.query.userId}) for event ${eventId}`);
    console.log(`[Socket] eventData keys:`, Object.keys(eventData || {}));
    console.log(`[Socket] eventData.items count:`, eventData?.items?.length || 0);
    
    // Log claimed items in the incoming update
    if (eventData.items && Array.isArray(eventData.items)) {
      const claimedItems = eventData.items.filter(item => item.claimedBy);
      if (claimedItems.length > 0) {
        console.log(`[Socket] Incoming update has ${claimedItems.length} claimed items:`, claimedItems.map(item => ({
          id: item.id,
          name: item.name,
          claimedBy: item.claimedBy
        })));
      }
    }
    
    // Update event in storage
    const existingEvent = events.get(eventId);
    if (existingEvent) {
      const ownerId = existingEvent.ownerId || actualUserId;
      
      // Participants are already user IDs - use them directly for sharedWith
      // Normalize old sharedWith for comparison
      const oldSharedWith = (existingEvent.sharedWith || [ownerId]).map(id => id?.toLowerCase());
      
      console.log(`[Socket] Existing event sharedWith: ${oldSharedWith.join(', ')}, ownerId: ${ownerId}`);
      
      let sharedWith = [];
      let participants = [];
      
      // If participants are provided, normalize them to lowercase IDs and filter duplicates
      if (eventData.participants && Array.isArray(eventData.participants) && eventData.participants.length > 0) {
        // Normalize participants to lowercase IDs (handle both names and IDs)
        const normalizedParticipants = [];
        for (const participant of eventData.participants) {
          if (!participant) continue;
          // Convert to lowercase ID
          const normalizedId = participant.toLowerCase();
          // Check if it's a valid user ID
          if (users.has(normalizedId) && !normalizedParticipants.includes(normalizedId)) {
            normalizedParticipants.push(normalizedId);
          }
        }
        
        // Build sharedWith from normalized participants, filtering duplicates
        const normalizedOwnerId = ownerId?.toLowerCase();
        sharedWith = [normalizedOwnerId]; // Start with owner
        for (const participantId of normalizedParticipants) {
          if (participantId && !sharedWith.includes(participantId)) {
            sharedWith.push(participantId);
          }
        }
        console.log(`[Socket] Updated sharedWith from participants: ${oldSharedWith.join(', ')} -> ${sharedWith.join(', ')}`);
        
        // Use normalized participants
        participants = normalizedParticipants;
      } else {
      // Ensure owner is always in sharedWith
        const normalizedOwnerId = ownerId?.toLowerCase();
        sharedWith = oldSharedWith.length > 0 ? [...oldSharedWith] : [normalizedOwnerId];
        if (!sharedWith.includes(normalizedOwnerId)) {
          sharedWith.unshift(normalizedOwnerId);
          console.log(`[Socket] Added owner ${normalizedOwnerId} to sharedWith`);
        }
        // Keep existing participants if no new ones provided
        participants = (existingEvent.participants || []).map(p => p?.toLowerCase());
      }
      
      // Normalize both arrays before comparison
      const normalizedOldSharedWith = [...new Set(oldSharedWith.map(id => id?.toLowerCase()))].sort();
      const normalizedNewSharedWith = [...new Set(sharedWith.map(id => id?.toLowerCase()))].sort();
      const wasSharedWithUpdated = JSON.stringify(normalizedOldSharedWith) !== JSON.stringify(normalizedNewSharedWith);
      
      // Check if archived status changed
      const wasArchived = existingEvent.archived === true;
      const isNowArchived = eventData.archived === true;
      const archivedStatusChanged = wasArchived !== isNowArchived;
      
      if (archivedStatusChanged) {
        console.log(`[Socket] Event ${eventId} archived status changed: ${wasArchived} -> ${isNowArchived}`);
      }
      
      // Ensure participants and sharedWith are normalized before storing
      const normalizedParticipants = [...new Set(participants.map(p => p?.toLowerCase()).filter(Boolean))];
      const normalizedSharedWith = [...new Set(sharedWith.map(s => s?.toLowerCase()).filter(Boolean))];
      
      events.set(eventId, {
        ...existingEvent,
        ...eventData,
        participants: normalizedParticipants,
        sharedWith: normalizedSharedWith,
        updatedAt: Date.now(),
      });
      
      // If archived status changed, notify all participants to reload their event lists
      if (archivedStatusChanged) {
        normalizedSharedWith.forEach(targetUserId => {
          if (targetUserId !== actualUserId?.toLowerCase()) {
            const targetUser = users.get(targetUserId);
            if (targetUser && targetUser.socketId) {
              io.to(targetUser.socketId).emit("events:reload");
              console.log(`[Socket] Sent events:reload to user ${targetUserId} for archived status change on event ${eventId}`);
            }
          }
        });
      }
      
      // Calculate newly added and removed users for notification
      let newlyAddedUsers = [];
      let removedUsers = [];
      if (wasSharedWithUpdated) {
        // Use normalized arrays for comparison
        newlyAddedUsers = normalizedSharedWith.filter(uid => !normalizedOldSharedWith.includes(uid));
        removedUsers = normalizedOldSharedWith.filter(uid => !normalizedSharedWith.includes(uid));
        
        console.log(`[Socket] sharedWith updated - newly added: [${newlyAddedUsers.join(', ')}], removed: [${removedUsers.join(', ')}]`);
        
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
      
      // Notify all users who have access to this event (use normalized arrays)
      console.log(`[Socket] Preparing to notify users in sharedWith: ${normalizedSharedWith.join(', ')}, sender: ${actualUserId}`);
            const eventToSend = events.get(eventId);
      // Ensure participants and sharedWith are normalized (lowercase IDs only, no duplicates)
      const normalizedEventToSend = {
              ...eventToSend,
        participants: normalizedParticipants,
        sharedWith: normalizedSharedWith,
      };
      
      // Log items being sent for debugging
      if (normalizedEventToSend.items && normalizedEventToSend.items.length > 0) {
        const claimedItems = normalizedEventToSend.items.filter(item => item.claimedBy);
        if (claimedItems.length > 0) {
          console.log(`[Socket] Event has ${claimedItems.length} claimed items:`, claimedItems.map(item => ({
            id: item.id,
            name: item.name,
            claimedBy: item.claimedBy
          })));
        }
      }
      
      // Log archived status
      if (normalizedEventToSend.archived !== undefined) {
        console.log(`[Socket] Event ${eventId} archived status: ${normalizedEventToSend.archived}`);
      }
      
      // Only send event:update to existing participants (not newly added ones - they already got events:reload)
      normalizedSharedWith.forEach(targetUserId => {
        const normalizedActualUserId = actualUserId?.toLowerCase();
        if (targetUserId !== normalizedActualUserId) { // Don't send back to sender
          // Skip newly added users - they already received events:reload
          if (wasSharedWithUpdated && newlyAddedUsers.includes(targetUserId)) {
            console.log(`[Socket] Skipping event:update to newly added user ${targetUserId} (already sent events:reload)`);
            return;
          }
          
          const targetUser = users.get(targetUserId);
          console.log(`[Socket] Checking user ${targetUserId}:`, targetUser ? `found (socketId=${targetUser.socketId}, online=${targetUser.online})` : 'not found');
          if (targetUser && targetUser.socketId) {
            // Items already have user IDs - send as-is
            console.log(`[Socket] Sending event:update to user ${targetUserId} (socketId=${targetUser.socketId}), items count: ${normalizedEventToSend.items?.length || 0}`);
            io.to(targetUser.socketId).emit("event:update", {
              eventId,
              eventData: normalizedEventToSend,
              fromUserId: normalizedActualUserId,
              serverTs: Date.now(),
            });
            console.log(`[Socket] Sent event:update to user ${targetUserId} (socketId=${targetUser.socketId})`);
          } else {
            console.log(`[Socket] User ${targetUserId} not found or not online (socketId missing)`);
          }
        } else {
          console.log(`[Socket] Skipping sender ${targetUserId}`);
        }
      });
      
      console.log(`[Socket] Event updated: ${eventId} by ${actualUserId}, sharedWith: ${sharedWith.join(', ')}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`[Socket] Disconnect: socketId=${socket.id}`);
    if (userId) {
      const user = users.get(userId);
      if (user) {
        user.online = false;
        user.lastSeen = Date.now();
      }
    }
  });
});


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

// --- User Management Endpoints ---

// Helper to ensure Alice and Bob are always friends (hardcoded for demo)
const ensureAliceAndBobFriendship = () => {
  const aliceId = 'alice';
  const bobId = 'bob';
  
  // Check if both users exist
  if (!users.has(aliceId) || !users.has(bobId)) {
    return;
  }
  
  const friendshipKey = `${aliceId}_${bobId}`;
  
  // Create friendship if it doesn't exist yet
  if (!friendships.has(friendshipKey)) {
    friendships.set(friendshipKey, {
        userId1: aliceId,
        userId2: bobId,
        createdAt: Date.now(),
      });
    console.log(`[API] Hardcoded friendship: Alice and Bob are always friends`);
  }
};

// Helper to create default events (Friendsgiving and Roommates 602)
// Always hardcode Alice and Bob as participants since they're the only users
const ensureDefaultEvents = () => {
  const aliceId = 'alice';
  const bobId = 'bob';
  const sharedWith = [aliceId, bobId];
  const participants = [aliceId, bobId];
  const ownerId = aliceId; // Alice is the owner
  
  console.log(`[API] ensureDefaultEvents: creating events with participants [${participants.join(', ')}]`);
  
  let eventsCreated = false;
  
  // Create Friendsgiving event if it doesn't exist and hasn't been deleted
  if (!events.has(FRIENDSGIVING_EVENT_ID) && !deletedEvents.has(FRIENDSGIVING_EVENT_ID)) {
    const friendsgivingEvent = {
      id: FRIENDSGIVING_EVENT_ID,
      title: 'Friendsgiving',
      items: [
        { id: 1, name: 'turkey', urgent: true, claimedBy: aliceId, bought: false, price: null },
        { id: 2, name: 'stuffing', urgent: false, claimedBy: null, bought: false, price: null },
        { id: 3, name: 'cranberry sauce', urgent: true, claimedBy: null, bought: false, price: null },
        { id: 4, name: 'pumpkin pie', urgent: false, claimedBy: bobId, bought: false, price: null },
        { id: 5, name: 'green beans', urgent: true, claimedBy: null, bought: false, price: null },
      ],
      participants: participants,
      ownerId: ownerId,
      sharedWith: sharedWith,
      archived: false, // Explicitly set archived status
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    events.set(FRIENDSGIVING_EVENT_ID, friendsgivingEvent);
    console.log(`[API] Created default Friendsgiving event (shared with ${sharedWith.join(', ')})`);
    eventsCreated = true;
  }
  
  // Create Roommates 602 event if it doesn't exist and hasn't been deleted
  if (!events.has(ROOMMATES_EVENT_ID) && !deletedEvents.has(ROOMMATES_EVENT_ID)) {
    const roommatesEvent = {
      id: ROOMMATES_EVENT_ID,
      title: 'Unit 602 Roommates!',
      items: [
        { id: 1, name: 'dish soap', urgent: true, claimedBy: aliceId, bought: false, price: null },
        { id: 2, name: 'paper towel', urgent: false, claimedBy: null, bought: false, price: null },
        { id: 3, name: 'flower', urgent: true, claimedBy: null, bought: false, price: null },
        { id: 4, name: 'milk 2%', urgent: true, claimedBy: aliceId, bought: false, price: null },
      ],
      participants: participants,
      ownerId: ownerId,
      sharedWith: sharedWith,
      archived: false, // Explicitly set archived status
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    events.set(ROOMMATES_EVENT_ID, roommatesEvent);
    console.log(`[API] Created default Unit 602 Roommates event (shared with ${sharedWith.join(', ')})`);
    eventsCreated = true;
  }
  
  // If events were created, notify online users to reload
  if (eventsCreated) {
    const aliceUser = users.get(aliceId);
    const bobUser = users.get(bobId);
    
    if (aliceUser?.socketId) {
      io.to(aliceUser.socketId).emit("events:reload");
      console.log(`[API] Notified Alice to reload events`);
    }
    if (bobUser?.socketId) {
      io.to(bobUser.socketId).emit("events:reload");
      console.log(`[API] Notified Bob to reload events`);
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
  
  // Ensure Alice and Bob are friends (hardcoded for demo)
  ensureAliceAndBobFriendship();
  
  // Ensure default events exist (Friendsgiving and Roommates 602)
  ensureDefaultEvents();
  
  res.json({ user: userData });
});

// Get friends list
app.get("/api/friends/:userId", (req, res) => {
  const { userId } = req.params;
  
  console.log(`[API] GET /api/friends/${userId} - Total friendships: ${friendships.size}`);
  
  // Ensure Alice and Bob are friends (hardcoded for demo)
  ensureAliceAndBobFriendship();
  
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
  
  // Ensure default events exist before returning
  const eventsCreated = ensureDefaultEvents();
  if (eventsCreated) {
    console.log(`[API] Default events were just created`);
  }
  
  const userEvents = [];
  for (const [eventId, event] of events.entries()) {
    // Include events owned by user or shared with user
    if (event.ownerId === userId || (event.sharedWith && event.sharedWith.includes(userId))) {
      console.log(`[API] Event ${eventId} matches user ${userId}`);
      
      // Items already have user IDs - send as-is
      userEvents.push(event);
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
  
  // Items already have user IDs - send as-is
  res.json({ event });
});

// Create or update event
app.post("/api/events", (req, res) => {
  const { userId, eventId, eventData } = req.body;
  
  if (!userId || !eventData) {
    return res.status(400).json({ error: "userId and eventData are required" });
  }
  
  const eventIdToUse = eventId || `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const existingEvent = events.get(eventIdToUse);
  
  // Participants are already user IDs - use them directly for sharedWith
  let sharedWith = [userId]; // Start with owner
  
  if (eventData.participants && Array.isArray(eventData.participants)) {
    // Normalize participants to lowercase IDs (handle both names and IDs)
    const normalizedParticipants = [];
    for (const participant of eventData.participants) {
      if (!participant) continue;
      // Convert to lowercase ID
      const normalizedId = participant.toLowerCase();
      // Check if it's a valid user ID
      if (users.has(normalizedId) && !normalizedParticipants.includes(normalizedId)) {
        normalizedParticipants.push(normalizedId);
      }
    }
    
    // Build sharedWith from normalized participants, filtering duplicates
    sharedWith = [userId]; // Start with owner
    for (const participantId of normalizedParticipants) {
      if (participantId && !sharedWith.includes(participantId)) {
        sharedWith.push(participantId);
      }
    }
    
    // Log which accounts are involved
    const involvedUsers = sharedWith.map(uid => {
      const user = users.get(uid);
      return user ? `${user.name} (${uid})` : uid;
    });
    console.log(`[API] Event involves ${sharedWith.length} account(s): ${involvedUsers.join(', ')}`);
    
    // Use normalized participants
    participants = normalizedParticipants;
  } else {
    // If no participants provided, use existing sharedWith or provided sharedWith
    sharedWith = eventData.sharedWith || existingEvent?.sharedWith || [userId];
    // Ensure no duplicates in existing array
    const seen = new Set();
    sharedWith = sharedWith.filter(id => {
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    // Ensure owner is included
    if (!sharedWith.includes(userId)) {
      sharedWith.unshift(userId);
    }
  }
  
  // Validate: ensure owner is always in sharedWith (should already be there, but double-check)
  if (!sharedWith.includes(userId)) {
    sharedWith.unshift(userId); // Add owner at the beginning
  }
  
  console.log(`[API] Final sharedWith: ${sharedWith.join(', ')}`);
  
  // Items already have user IDs in claimedBy and sharedBy fields
  const ownerId = existingEvent?.ownerId || userId;
  
  // Participants are already normalized above if eventData.participants was provided
  // Otherwise, use existing participants or empty array
  if (!participants) {
    participants = existingEvent?.participants || [];
  }
  
  // Normalize participants and sharedWith before storing (lowercase, no duplicates)
  const normalizedParticipants = [...new Set((participants || []).map(p => p.toLowerCase()))];
  const normalizedSharedWith = [...new Set((sharedWith || []).map(s => s.toLowerCase()))];
  
  const event = {
    id: eventIdToUse,
    ...eventData,
    participants: normalizedParticipants,
    ownerId: ownerId,
    sharedWith: normalizedSharedWith,
    createdAt: existingEvent?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  
  events.set(eventIdToUse, event);
  
  // Update local variables to use normalized values for notifications
  participants = normalizedParticipants;
  sharedWith = normalizedSharedWith;
  
  // Notify all users who have access to this event
  const isNewEvent = !existingEvent;
  const wasSharedWithUpdated = existingEvent && 
    JSON.stringify((existingEvent.sharedWith || []).sort()) !== JSON.stringify(sharedWith.sort());
  
  // If this is a new event, notify all participants (except the creator)
  if (isNewEvent) {
    sharedWith.forEach(targetUserId => {
      if (targetUserId !== userId) { // Don't notify the creator
        const targetUser = users.get(targetUserId);
        if (targetUser && targetUser.socketId) {
          io.to(targetUser.socketId).emit("events:reload");
          console.log(`[API] Sent events:reload to user ${targetUserId} for new event ${eventIdToUse}`);
        } else {
          console.log(`[API] User ${targetUserId} not found or not online, will see event on next reload`);
        }
      }
    });
  }
  // Check if archived status changed
  const wasArchived = existingEvent?.archived === true;
  const isNowArchived = eventData.archived === true;
  const archivedStatusChanged = existingEvent && wasArchived !== isNowArchived;
  
  if (archivedStatusChanged) {
    console.log(`[API] Event ${eventIdToUse} archived status changed: ${wasArchived} -> ${isNowArchived}`);
  }
  
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
  
  // If archived status changed, notify all participants to reload their event lists
  if (archivedStatusChanged) {
    sharedWith.forEach(targetUserId => {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        io.to(targetUser.socketId).emit("events:reload");
        console.log(`[API] Sent events:reload to user ${targetUserId} for archived status change on event ${eventIdToUse}`);
      }
    });
  }
  
  // Normalize participants and sharedWith before sending
  const normalizedEvent = {
    ...event,
    participants: [...new Set((participants || []).map(p => p.toLowerCase()))],
    sharedWith: [...new Set((sharedWith || []).map(s => s.toLowerCase()))],
  };
  
  sharedWith.forEach(targetUserId => {
    if (targetUserId !== userId) {
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        // For new events or when sharedWith was updated, send events:reload to ensure the client refreshes
        if (isNewEvent || wasSharedWithUpdated) {
          io.to(targetUser.socketId).emit("events:reload");
          console.log(`[API] Sent events:reload to user ${targetUserId} for event ${eventIdToUse}`);
        } else {
          // For regular updates, send event:update with normalized data
          // Items already have user IDs - send as-is
          io.to(targetUser.socketId).emit("event:update", {
            eventId: eventIdToUse,
            eventData: normalizedEvent,
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

// Delete event
app.delete("/api/events/:eventId", (req, res) => {
  const { eventId } = req.params;
  // Try to get userId from body first, then from query params
  const userId = req.body?.userId || req.query?.userId;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  const event = events.get(eventId);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  
  // Check if user has permission to delete (must be owner or participant)
  const ownerId = event.ownerId || userId;
  const sharedWith = event.sharedWith || [];
  const participants = event.participants || [];
  const normalizedUserId = userId.toLowerCase();
  
  if (ownerId.toLowerCase() !== normalizedUserId && 
      !sharedWith.some(id => id.toLowerCase() === normalizedUserId) &&
      !participants.some(id => id.toLowerCase() === normalizedUserId)) {
    return res.status(403).json({ error: "Not authorized to delete this event" });
  }
  
  // Get all participants who should be notified
  const allParticipants = [...new Set([
    ...(sharedWith || []),
    ...(participants || []),
    ownerId
  ].filter(id => id && typeof id === 'string').map(id => id.toLowerCase()))];
  
  // Delete the event and mark it as deleted to prevent recreation
  events.delete(eventId);
  deletedEvents.add(eventId);
  console.log(`[API] Event ${eventId} deleted by user ${userId} (marked as deleted to prevent recreation)`);
  
  // Broadcast deletion to all participants
  allParticipants.forEach(targetUserId => {
    if (targetUserId !== normalizedUserId) { // Don't notify the deleter
      const targetUser = users.get(targetUserId);
      if (targetUser && targetUser.socketId) {
        io.to(targetUser.socketId).emit("event:delete", {
          eventId,
          fromUserId: normalizedUserId,
        });
        console.log(`[API] Sent event:delete to user ${targetUserId} for event ${eventId}`);
      }
    }
  });
  
  res.json({ success: true, eventId });
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