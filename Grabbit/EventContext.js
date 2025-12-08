// EventContext.js
import React, { createContext, useState, useEffect, useRef, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from './api';
import { SERVER_URL } from './config';

export const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const STORAGE_KEY = 'grabbit:data:v1';
  const { currentUser } = useAuth();
  const socketRef = useRef(null);
  const eventsRef = useRef([]);
  const archivedEventsRef = useRef([]);
  // Track locally deleted event IDs to prevent them from being restored on reload
  const deletedEventIdsRef = useRef(new Set());

  // Helper to normalize user identifier for comparison (handles both IDs and names)
  const normalizeUserId = (userId) => {
    if (!userId) return null;
    return userId.toLowerCase();
  };

  // Active events (home)
  const [events, setEvents] = useState([]);

  // Archived events (profile/archive tab)
  const [archivedEvents, setArchivedEvents] = useState([]);

  // ---- SHARED FRIENDS LIST (used by Profile + AddEventModal) ----
  const [friends, setFriends] = useState([]);
  // Profile info
  const [profile, setProfile] = useState({
    name: 'Grab Bit',
    phone: '508-667-1234',
    email: 'grabbit@upenn.edu',
  });

  const hasHydrated = useRef(false);
  const saveTimeout = useRef(null);

  // Load friends from backend when user is available
  useEffect(() => {
    if (!currentUser?.id) return;

    const loadFriendsFromBackend = async () => {
      try {
        // Hardcode friends based on user name
        const userName = currentUser.name?.toLowerCase();
        let hardcodedFriends = [];
        
        if (userName === 'bob') {
          // Bob has Alice and some dummy friends
          hardcodedFriends = [
            { id: 'alice', name: 'Alice', phone: '555-111-2222', email: 'alice@grabbit.com' },
            { id: 'charlie', name: 'Charlie', phone: '555-444-5555', email: 'charlie@grabbit.com' },
            { id: 'david', name: 'David', phone: '555-666-7777', email: 'david@grabbit.com' },
            { id: 'emma', name: 'Emma', phone: '555-888-9999', email: 'emma@grabbit.com' },
          ];
        } else if (userName === 'alice') {
          // Alice has Bob and some dummy friends
          hardcodedFriends = [
            { id: 'bob', name: 'Bob', phone: '555-333-4444', email: 'bob@grabbit.com' },
            { id: 'charlie', name: 'Charlie', phone: '555-444-5555', email: 'charlie@grabbit.com' },
            { id: 'david', name: 'David', phone: '555-666-7777', email: 'david@grabbit.com' },
            { id: 'emma', name: 'Emma', phone: '555-888-9999', email: 'emma@grabbit.com' },
          ];
        } else {
          // For other users, try to load from backend
          const response = await api.getFriends(currentUser.id);
          hardcodedFriends = response.friends || [];
        }
        
        setFriends(hardcodedFriends);
      } catch (err) {
        console.error('[EventContext] Failed to load friends from backend:', err);
        // Set empty friends on error
        setFriends([]);
      }
    };

    loadFriendsFromBackend();
  }, [currentUser?.id, currentUser?.name]);

  // Function to reload events from backend (exposed for manual refresh)
  const reloadEvents = React.useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await api.getEvents(currentUser.id);
      const backendEvents = response.events || [];
      
      // Convert backend events to app format - keep actual user names/IDs
      // Separate archived and active events
      const activeEvents = [];
      const archivedEventsList = [];
      
      const normalizedCurrentUserIdForReload = currentUser?.id?.toLowerCase();
      
      backendEvents.forEach(e => {
        // Skip events that were locally deleted (even if they still exist on backend)
        // Convert both to string for comparison to handle number/string mismatches
        const eventIdStr = String(e.id);
        if (deletedEventIdsRef.current.has(eventIdStr) || 
            deletedEventIdsRef.current.has(e.id) ||
            Array.from(deletedEventIdsRef.current).some(deletedId => String(deletedId) === eventIdStr)) {
          console.log(`[EventContext] Skipping deleted event: ${e.id} (${e.title})`);
          return;
        }
        
        // IMPORTANT: Only check sharedWith for access control, not participants
        // participants can include dummy friends who don't have access
        // sharedWith is the source of truth for who has access to the event
        const eventSharedWith = e.sharedWith || [];
        const eventOwnerId = e.ownerId?.toLowerCase();
        const userHasAccess = eventOwnerId === normalizedCurrentUserIdForReload || 
                              eventSharedWith.some(p => 
                                normalizeUserId(p) === normalizeUserId(normalizedCurrentUserIdForReload)
                              );
        
        // Skip events where user does not have access
        if (!userHasAccess) {
          console.log(`[EventContext] Skipping event ${e.id} (${e.title}) - user does not have access (not in sharedWith and not owner)`);
          console.log(`[EventContext]   Event sharedWith: [${eventSharedWith.join(', ')}], ownerId: ${eventOwnerId}, userId: ${normalizedCurrentUserIdForReload}`);
          return;
        }
        
        const formattedEvent = {
          id: e.id,
          title: e.title,
          items: e.items || [],
          participants: e.participants || [],
          sharedWith: e.sharedWith || [], // Preserve sharedWith for access control
          ownerId: e.ownerId, // Preserve ownerId for access control
          isNew: false,
          archived: e.archived === true, // Preserve archived status from backend
        };
        
        if (formattedEvent.archived) {
          archivedEventsList.push(formattedEvent);
        } else {
          activeEvents.push(formattedEvent);
        }
      });
      
      // Double-check: filter out any events where user doesn't have access
      // This is a safety check in case backend returned events user shouldn't see
      // IMPORTANT: Only check sharedWith for access control, not participants
      const filteredActiveEvents = activeEvents.filter(e => {
        const eventSharedWith = e.sharedWith || [];
        const eventOwnerId = e.ownerId?.toLowerCase();
        const hasAccess = eventOwnerId === normalizedCurrentUserIdForReload || 
                          eventSharedWith.some(p => 
                            normalizeUserId(p) === normalizeUserId(normalizedCurrentUserIdForReload)
                          );
        if (!hasAccess) {
          console.log(`[EventContext] Filtering out event ${e.id} (${e.title}) - user does not have access (not in sharedWith and not owner)`);
        }
        return hasAccess;
      });
      
      const filteredArchivedEvents = archivedEventsList.filter(e => {
        const eventSharedWith = e.sharedWith || [];
        const eventOwnerId = e.ownerId?.toLowerCase();
        const hasAccess = eventOwnerId === normalizedCurrentUserIdForReload || 
                          eventSharedWith.some(p => 
                            normalizeUserId(p) === normalizeUserId(normalizedCurrentUserIdForReload)
                          );
        if (!hasAccess) {
          console.log(`[EventContext] Filtering out archived event ${e.id} (${e.title}) - user does not have access (not in sharedWith and not owner)`);
        }
        return hasAccess;
      });
      
      setEvents(filteredActiveEvents);
      setArchivedEvents(filteredArchivedEvents);
      // Keep refs in sync
      eventsRef.current = filteredActiveEvents;
      archivedEventsRef.current = filteredArchivedEvents;
      return [...filteredActiveEvents, ...filteredArchivedEvents];
    } catch (err) {
      // Network errors and timeouts are common - don't clear existing events, just log the warning
      const isNetworkError = err.name === 'AbortError' || 
                            err.message?.includes('Network request failed') || 
                            err.message?.includes('Failed to fetch') ||
                            err.message?.includes('Aborted');
      
      if (isNetworkError) {
        console.warn('[EventContext] Network request failed or timed out - server may be offline. Using existing events.');
        // Return current events instead of clearing them
        return [...eventsRef.current, ...archivedEventsRef.current];
      }
      
      // Only log as error for non-network issues
      console.error('[EventContext] Failed to reload events from backend:', err);
      console.error('[EventContext] Error details:', err.message);
      
      // Only clear events on non-network errors (like auth errors)
      setEvents([]);
      eventsRef.current = [];
      archivedEventsRef.current = [];
      return [];
    }
  }, [currentUser?.id, currentUser?.name]);

  // Load events from backend when user is available
  useEffect(() => {
    if (!currentUser?.id) return;
    
    // Small delay to ensure backend registration and event updates complete
    const loadEvents = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      await reloadEvents();
      hasHydrated.current = true;
    };
    
    loadEvents();
  }, [currentUser?.id, reloadEvents]);

  // Set up socket connection for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      query: { userId: currentUser.id },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[EventContext] Socket connected for user ${currentUser.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`[EventContext] Socket disconnected for user ${currentUser.id}`);
    });

    socket.on('connect_error', (error) => {
      console.error(`[EventContext] Socket connection error for user ${currentUser.id}:`, error);
    });

    // Listen for friend accepted events to reload friends list
    socket.on('friend:accepted', () => {
      const reloadFriends = async () => {
        if (!currentUser?.id) return;
        try {
          // Hardcode friends based on user name
          const userName = currentUser.name?.toLowerCase();
          let hardcodedFriends = [];
          
          if (userName === 'bob') {
            // Bob has Alice and some dummy friends
            hardcodedFriends = [
              { id: 'alice', name: 'Alice', phone: '555-111-2222', email: 'alice@grabbit.com' },
              { id: 'charlie', name: 'Charlie', phone: '555-444-5555', email: 'charlie@grabbit.com' },
              { id: 'david', name: 'David', phone: '555-666-7777', email: 'david@grabbit.com' },
              { id: 'emma', name: 'Emma', phone: '555-888-9999', email: 'emma@grabbit.com' },
            ];
          } else if (userName === 'alice') {
            // Alice has Bob and some dummy friends
            hardcodedFriends = [
              { id: 'bob', name: 'Bob', phone: '555-333-4444', email: 'bob@grabbit.com' },
              { id: 'charlie', name: 'Charlie', phone: '555-444-5555', email: 'charlie@grabbit.com' },
              { id: 'david', name: 'David', phone: '555-666-7777', email: 'david@grabbit.com' },
              { id: 'emma', name: 'Emma', phone: '555-888-9999', email: 'emma@grabbit.com' },
            ];
          } else {
            // For other users, try to load from backend
            const response = await api.getFriends(currentUser.id);
            hardcodedFriends = response.friends || [];
          }
          
          setFriends(hardcodedFriends);
        } catch (err) {
          console.error('[EventContext] Failed to reload friends:', err);
        }
      };
      reloadFriends();
    });

    // Listen for reload signal from server (when default events are created or shared)
    socket.on('events:reload', () => {
      // Use the shared reloadEvents function
      reloadEvents();
    });

    socket.on('event:delete', (payload) => {
      const { eventId, fromUserId } = payload;
      
      // Ignore our own deletions (case-insensitive comparison)
      if (fromUserId && currentUser?.id && normalizeUserId(fromUserId) === normalizeUserId(currentUser.id)) {
        console.log(`[EventContext] Ignoring own deletion for event: ${eventId}`);
        return;
      }
      
      console.log(`[EventContext] Received event:delete for event ${eventId} from ${fromUserId}`);

      // Track this event as deleted to prevent it from being restored on reload
      // Store as both string and original format to handle type mismatches
      deletedEventIdsRef.current.add(String(eventId));
      deletedEventIdsRef.current.add(eventId);
      console.log(`[EventContext] Marked event ${eventId} as deleted (from socket). Total deleted events: ${deletedEventIdsRef.current.size}`);

      // Remove ONLY this specific event from both lists immediately
      // This should NOT affect any other events
      const currentEvents = eventsRef.current;
      const currentArchived = archivedEventsRef.current;
      const eventExistsInActive = currentEvents.some(e => e.id === eventId);
      const eventExistsInArchived = currentArchived.some(e => e.id === eventId);
      
      if (eventExistsInActive || eventExistsInArchived) {
        console.log(`[EventContext] Removing ONLY event ${eventId} from local state (found in ${eventExistsInActive ? 'active' : ''} ${eventExistsInArchived ? 'archived' : ''})`);
        // Filter out ONLY the specific eventId - don't touch other events
        const newEvents = currentEvents.filter(e => e.id !== eventId);
        const newArchived = currentArchived.filter(e => e.id !== eventId);
        
        console.log(`[EventContext] Before removal: ${currentEvents.length} active, ${currentArchived.length} archived`);
        console.log(`[EventContext] After removal: ${newEvents.length} active, ${newArchived.length} archived`);
        console.log(`[EventContext] Remaining event IDs: active=[${newEvents.map(e => e.id).join(', ')}], archived=[${newArchived.map(e => e.id).join(', ')}]`);
        
        eventsRef.current = newEvents;
        archivedEventsRef.current = newArchived;
        setEvents(newEvents);
        setArchivedEvents(newArchived);
        console.log(`[EventContext] Successfully removed ONLY event ${eventId}. Other events remain untouched.`);
      } else {
        console.log(`[EventContext] Event ${eventId} not found in local state, but marked as deleted to prevent future restoration`);
      }
    });

    socket.on('event:update', (payload) => {
      const { eventId, eventData, fromUserId } = payload;
      
      console.log(`[EventContext] Received event:update for event ${eventId}, archived: ${eventData?.archived}, from: ${fromUserId}`);
      
      // Ignore updates for events that were locally deleted
      // Check both string and original format
      const eventIdStr = String(eventId);
      if (deletedEventIdsRef.current.has(eventIdStr) || 
          deletedEventIdsRef.current.has(eventId) ||
          Array.from(deletedEventIdsRef.current).some(deletedId => String(deletedId) === eventIdStr)) {
        console.log(`[EventContext] Ignoring update for deleted event: ${eventId}`);
        return;
      }
      
      // Ignore our own updates (case-insensitive comparison)
      if (fromUserId && currentUser?.id && fromUserId.toLowerCase() === currentUser.id.toLowerCase()) {
        console.log(`[EventContext] Ignoring own update for event: ${eventId}`);
        return;
      }

      // Use refs to get current state without nested setState
      const currentEvents = eventsRef.current;
      const currentArchived = archivedEventsRef.current;
      
      const eventInEvents = currentEvents.find(e => e.id === eventId);
      const eventInArchived = currentArchived.find(e => e.id === eventId);
      const existingEvent = eventInEvents || eventInArchived;
      
      // Check if current user still has access to the updated event
      // Use the updated data if available, otherwise fall back to existing event data
      // IMPORTANT: Only check sharedWith for access control, not participants
      // participants can include dummy friends who don't have access
      const updatedSharedWith = eventData.sharedWith !== undefined 
        ? eventData.sharedWith 
        : (existingEvent?.sharedWith || []);
      const updatedOwnerId = (eventData.ownerId || existingEvent?.ownerId || currentUser?.id)?.toLowerCase();
      const normalizedCurrentUserId = currentUser?.id?.toLowerCase();
      
      // Check if user still has access (case-insensitive)
      // User has access if they're the owner or in sharedWith
      // Do NOT check participants - it can include dummy friends
      const userIsOwner = updatedOwnerId === normalizedCurrentUserId;
      const userIsInSharedWith = updatedSharedWith.some(p => 
        normalizeUserId(p) === normalizeUserId(normalizedCurrentUserId)
      );
      const userStillHasAccess = userIsOwner || userIsInSharedWith;
      
      console.log(`[EventContext] Checking access for event ${eventId}: userStillHasAccess=${userStillHasAccess}, ownerId=${updatedOwnerId}, sharedWith=${JSON.stringify(updatedSharedWith)}, currentUserId=${normalizedCurrentUserId}`);
      
      // If user no longer has access, remove the event from local state
      if (!userStillHasAccess && existingEvent) {
        console.log(`[EventContext] User ${normalizedCurrentUserId} no longer has access to event ${eventId}, removing from local state`);
        // Track as deleted to prevent it from being restored
        deletedEventIdsRef.current.add(String(eventId));
        deletedEventIdsRef.current.add(eventId);
        // Remove from both lists
        const newEvents = currentEvents.filter(e => e.id !== eventId);
        const newArchived = currentArchived.filter(e => e.id !== eventId);
        
        eventsRef.current = newEvents;
        archivedEventsRef.current = newArchived;
        setEvents(newEvents);
        setArchivedEvents(newArchived);
        return; // Don't process further updates for this event
      }
      
      // If user doesn't have access and this is a new event, don't add it
      if (!userStillHasAccess && !existingEvent) {
        console.log(`[EventContext] Ignoring update for event ${eventId} - user does not have access`);
        return;
      }
      
      const isNowArchived = eventData.archived === true;
      const wasArchived = existingEvent?.archived === true;
      
      console.log(`[EventContext] Processing archive status change: wasArchived=${wasArchived}, isNowArchived=${isNowArchived}`);
      
      // Build updated event
      const updatedEvent = existingEvent ? {
        ...existingEvent,
        ...eventData,
        items: eventData.items || existingEvent.items,
        participants: eventData.participants !== undefined ? eventData.participants : existingEvent.participants,
        sharedWith: eventData.sharedWith !== undefined ? eventData.sharedWith : existingEvent.sharedWith,
        archived: eventData.archived !== undefined ? eventData.archived : existingEvent.archived,
      } : {
        id: eventId,
        title: eventData.title || 'Untitled',
        items: eventData.items || [],
        participants: eventData.participants || [],
        sharedWith: eventData.sharedWith || [],
        archived: isNowArchived,
        isNew: false,
        ...eventData,
      };
      
      // Update both lists synchronously
      let newEvents = [...currentEvents];
      let newArchived = [...currentArchived];
      
      if (isNowArchived) {
        // Should be archived
        if (eventInEvents) {
          // Remove from events
          newEvents = newEvents.filter(e => e.id !== eventId);
        }
        // Add/update in archived
        const archIndex = newArchived.findIndex(e => e.id === eventId);
        if (archIndex >= 0) {
          newArchived[archIndex] = updatedEvent;
        } else {
          newArchived = [updatedEvent, ...newArchived];
        }
      } else {
        // Should not be archived
        if (eventInArchived) {
          // Remove from archived
          newArchived = newArchived.filter(e => e.id !== eventId);
        }
        // Add/update in events
        const eventsIndex = newEvents.findIndex(e => e.id === eventId);
        if (eventsIndex >= 0) {
          newEvents[eventsIndex] = updatedEvent;
        } else {
          newEvents = [updatedEvent, ...newEvents];
        }
      }
      
      // Update state and refs synchronously
      eventsRef.current = newEvents;
      archivedEventsRef.current = newArchived;
      setEvents(newEvents);
      setArchivedEvents(newArchived);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser?.id, reloadEvents]);

  // Save to storage with light debounce
  useEffect(() => {
    if (!hasHydrated.current) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(async () => {
      try {
        const payload = JSON.stringify({
          events,
          archivedEvents,
          friends,
          profile,
        });
        await AsyncStorage.setItem(STORAGE_KEY, payload);
      } catch (err) {
        // Failed to save data
      }
    }, 300);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [events, archivedEvents, friends, profile]);

  // --- CRUD helpers ---

  const addEvent = async (newEvent) => {
    // Ensure current user is in participants if not already
    // Convert participant names to IDs for backend
    const participants = newEvent.participants ?? [];
    const participantIds = participants.map(p => {
      // If it's already an ID (lowercase), use it
      if (p === p.toLowerCase()) return p;
      // Otherwise, find the friend by name and get their ID
      const friend = friends.find(f => f.name === p);
      return friend ? friend.id : p;
    });
    
    const participantsWithUser = participantIds.includes(currentUser?.id) 
      ? participantIds 
      : [currentUser?.id, ...participantIds].filter(Boolean);
    
    const eventToAdd = {
      ...newEvent,
      items: newEvent.items ?? [],
      participants: participantsWithUser, // Now contains IDs
      isNew: true,
      archived: false,
    };

    setEvents(currentEvents => {
      const updated = [eventToAdd, ...currentEvents];
      eventsRef.current = updated;
      return updated;
    });

    // Sync with backend
    if (currentUser?.id) {
      try {
        // sharedWith should be the same as participants (both are IDs now)
        const sharedWith = participantsWithUser;
        
        console.log('[EventContext] Saving new event to backend:', {
          eventId: newEvent.id,
          title: eventToAdd.title,
          participants: participantsWithUser,
          userId: currentUser.id
        });
        
        const saveResponse = await api.saveEvent(currentUser.id, newEvent.id, {
          title: eventToAdd.title,
          items: eventToAdd.items,
          participants: participantsWithUser, // Send IDs to backend
          sharedWith,
        });
        
        console.log('[EventContext] Successfully saved new event to backend, response:', saveResponse);
        
        // Mark event as no longer new after successful save
        setEvents(currentEvents => {
          const updated = currentEvents.map(e => 
            e.id === newEvent.id ? { ...e, isNew: false } : e
          );
          eventsRef.current = updated;
          return updated;
        });
        
        // Send real-time update via socket
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('event:update', {
            eventId: newEvent.id,
            eventData: {
              title: eventToAdd.title,
              items: eventToAdd.items,
              participants: eventToAdd.participants,
            },
          });
          console.log('[EventContext] Sent socket update for new event');
        } else {
          console.warn('[EventContext] Socket not connected, cannot send real-time update for new event');
        }
      } catch (err) {
        console.error('[EventContext] Failed to sync new event:', err);
        console.error('[EventContext] Event will remain in local state with isNew: true');
        // Event remains in local state with isNew: true
        // It can be retried later or will be saved when user comes back online
      }
    }
  };

  const updateItems = async (eventId, updatedItems) => {
    // Return a promise that resolves when persistence completes
    return new Promise(async (resolve, reject) => {
    const updater = list =>
      list.map(e => (e.id === eventId ? { ...e, items: updatedItems } : e));

    // Update state and refs
    setEvents(prev => {
      const updated = updater(prev);
      eventsRef.current = updated;
      return updated;
    });
    setArchivedEvents(prev => {
      const updated = updater(prev);
      archivedEventsRef.current = updated;
      return updated;
    });

    // Sync with backend
    if (currentUser?.id) {
      try {
        // IMPORTANT: Use refs to get the latest event data, not state (state updates are async)
        const event = eventsRef.current.find(e => e.id === eventId) || 
                     archivedEventsRef.current.find(e => e.id === eventId);
        
        if (event) {
          // Build the event data to save with updated items
          const eventDataToSave = {
            ...event,
            items: updatedItems,
            participants: event.participants || [],
            title: event.title,
            archived: event.archived || false,
          };
          
          // Send real-time update via socket FIRST for immediate updates
          // Don't send sharedWith - let server compute it from participants
          if (socketRef.current && socketRef.current.connected) {
            const { sharedWith, ...eventWithoutSharedWith } = eventDataToSave;
            const payload = {
              eventId,
              eventData: {
                ...eventWithoutSharedWith,
                items: updatedItems,
                participants: event.participants || [],
              },
            };
            socketRef.current.emit('event:update', payload);
            console.log(`[EventContext] Sent socket update for event ${eventId} with ${updatedItems.length} items`);
          } else {
            console.warn(`[EventContext] Socket not connected, skipping socket update for event ${eventId}`);
          }
          
          // CRITICAL: Persist to backend via REST API - this MUST complete to ensure data is saved
          // Even if socket is not connected, we need to persist to backend
          // Use await to ensure it completes (but don't block the UI)
          try {
            await api.saveEvent(currentUser.id, eventId, eventDataToSave);
            console.log(`[EventContext] Successfully persisted event ${eventId} to backend with ${updatedItems.length} items`);
            resolve(); // Resolve promise on success
          } catch (persistErr) {
            // Log error but don't throw - we've already updated local state
            console.error(`[EventContext] Failed to persist event ${eventId} to backend:`, persistErr);
            console.error(`[EventContext] Error details:`, persistErr.message);
            // Reload events to restore from backend on error
            // This ensures we don't lose data if persistence fails
            setTimeout(() => {
              console.log(`[EventContext] Reloading events after persistence failure for event ${eventId}`);
              reloadEvents();
            }, 1000);
            reject(persistErr); // Reject promise on failure
          }
        } else {
          console.warn(`[EventContext] Event ${eventId} not found in refs, cannot persist items update`);
          reject(new Error(`Event ${eventId} not found`));
        }
      } catch (err) {
        console.error('[EventContext] Failed to sync items update:', err);
        console.error('[EventContext] Error details:', err.message);
        reject(err);
      }
    } else {
      // No current user - resolve immediately (can't persist)
      resolve();
    }
    });
  };

  const updateParticipants = async (eventId, updatedParticipants) => {
    console.log(`[EventContext] updateParticipants called for event ${eventId} with participants:`, updatedParticipants);
    
    // Only update the specific event - use eventId to scope the update
    const updater = list =>
      list.map(e => {
        if (e.id === eventId) {
          console.log(`[EventContext] Updating participants for event ${eventId} from [${(e.participants || []).join(', ')}] to [${updatedParticipants.join(', ')}]`);
          return { ...e, participants: updatedParticipants };
        }
        // Don't modify other events
        return e;
      });

    // Store previous state in case we need to rollback
    const previousEvents = [...events];
    const previousArchivedEvents = [...archivedEvents];

    setEvents(prev => {
      const updated = updater(prev);
      eventsRef.current = updated;
      console.log(`[EventContext] Updated events list. Event ${eventId} participants updated. Total events: ${updated.length}`);
      return updated;
    });
    setArchivedEvents(prev => {
      const updated = updater(prev);
      archivedEventsRef.current = updated;
      console.log(`[EventContext] Updated archived events list. Event ${eventId} participants updated. Total archived: ${updated.length}`);
      return updated;
    });

    // Sync with backend
    if (currentUser?.id) {
      try {
        const event = previousEvents.find(e => e.id === eventId) || previousArchivedEvents.find(e => e.id === eventId);
        if (event) {
          // Don't send sharedWith - let backend resolve it from participants
          const { sharedWith, ...eventWithoutSharedWith } = event;
          
          await api.saveEvent(currentUser.id, eventId, {
            ...eventWithoutSharedWith,
            participants: updatedParticipants,
            // Let backend resolve sharedWith from participants
          });
          
          // Send real-time update via socket
          // Don't send sharedWith - let backend resolve it from participants
          if (socketRef.current) {
            const { sharedWith: _, ...eventWithoutSharedWithSocket } = event;
            socketRef.current.emit('event:update', {
              eventId,
              eventData: {
                ...eventWithoutSharedWithSocket,
                participants: updatedParticipants,
              },
            });
          }
        }
      } catch (err) {
        console.error('[EventContext] Failed to sync participants update:', err);
        // Rollback to previous state on error
        setEvents(previousEvents);
        setArchivedEvents(previousArchivedEvents);
        // Re-throw error so the caller can handle it
        throw err;
      }
    }
  };

  const deleteEvent = async (id) => {
    // Find the event to check if it was ever saved to backend
    // MUST check BEFORE removing from arrays
    const eventToDelete = events.find(e => e.id === id) || archivedEvents.find(e => e.id === id);
    const isNewEvent = eventToDelete?.isNew === true;
    
    // Track this event as deleted to prevent it from being restored on reload
    // Store as both string and original format to handle type mismatches
    deletedEventIdsRef.current.add(String(id));
    deletedEventIdsRef.current.add(id);
    console.log(`[EventContext] Marked event as deleted: ${id}, total deleted: ${deletedEventIdsRef.current.size}`);
    
    // Update local state immediately
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      eventsRef.current = updated;
      return updated;
    });
    setArchivedEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      archivedEventsRef.current = updated;
      return updated;
    });

    // Sync with backend and broadcast to all participants
    if (currentUser?.id) {
      // Get participants before deletion for socket broadcast
      const participants = eventToDelete?.participants || [];
      const sharedWith = eventToDelete?.sharedWith || [];
      const allParticipants = [...new Set([...participants, ...sharedWith, eventToDelete?.ownerId].filter(Boolean))];
      
      // If event was never saved to backend (isNew: true), skip backend call
      if (isNewEvent) {
        // Still broadcast deletion via socket in case other clients have it
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('event:delete', {
            eventId: id,
            fromUserId: currentUser.id,
            participants: allParticipants,
          });
          console.log(`[EventContext] Emitted event:delete via socket for new event ${id} to participants:`, allParticipants);
        }
        return;
      }
      
      try {
        await api.deleteEvent(currentUser.id, id);

        // Send real-time deletion via socket (server will also broadcast, but this ensures immediate delivery)
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('event:delete', {
            eventId: id,
            fromUserId: currentUser.id,
            participants: allParticipants,
          });
          console.log(`[EventContext] Emitted event:delete via socket for event ${id} to participants:`, allParticipants);
        }
      } catch (err) {
        // If event not found (404), it might have been already deleted or never synced
        // In this case, still broadcast the deletion via socket and proceed silently
        // The local state has already been updated, so we don't need to rollback
        if (err.message && err.message.includes('404')) {
          // Event doesn't exist on server - silently handle and broadcast deletion via socket
          if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('event:delete', {
              eventId: id,
              fromUserId: currentUser.id,
              participants: allParticipants,
            });
            console.log(`[EventContext] Emitted event:delete via socket for 404 event ${id} to participants:`, allParticipants);
          }
          // Silently proceed - no error logging for expected 404
        } else {
          // For other errors, reload events to restore state
          console.error('[EventContext] Failed to delete event:', err);
          reloadEvents();
        }
      }
    }
  };

  const archiveEvent = async (id) => {
    const target = events.find(e => e.id === id) || archivedEvents.find(e => e.id === id);
    if (!target) return;

    const archivedCopy = { ...target, archived: true };

    // Update local state
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      eventsRef.current = updated;
      return updated;
    });
    setArchivedEvents(archPrev => {
      const updated = [archivedCopy, ...archPrev];
      archivedEventsRef.current = updated;
      return updated;
    });

    // Sync with backend and broadcast to all participants
    if (currentUser?.id) {
      // Persist to backend first, then broadcast only on success
      try {
        await api.saveEvent(currentUser.id, id, {
          ...target,
          archived: true,
          participants: target.participants || [],
        });
        
        // Only send socket broadcast after successful persistence
        if (socketRef.current && socketRef.current.connected) {
          const { sharedWith, ...eventWithoutSharedWith } = target;
          console.log(`[EventContext] Emitting archive socket update for event ${id}`);
          socketRef.current.emit('event:update', {
            eventId: id,
            eventData: {
              ...eventWithoutSharedWith,
              title: target.title,
              items: target.items || [],
              archived: true,
              participants: target.participants || [],
            },
          });
        } else {
          console.warn(`[EventContext] Socket not connected, cannot broadcast archive for event ${id}`);
        }
      } catch (err) {
        console.error('[EventContext] Failed to persist archive to backend:', err);
        // Reload events to restore state on error (rollback local state)
        reloadEvents();
        // Don't send socket broadcast since persistence failed
      }
    }
  };

  const unarchiveEvent = async (id) => {
    const target = archivedEvents.find(e => e.id === id) || events.find(e => e.id === id);
    if (!target) return;

    const activeCopy = { ...target, archived: false };

    // Update local state
    setArchivedEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      archivedEventsRef.current = updated;
      return updated;
    });
    setEvents(eventsPrev => {
      const updated = [activeCopy, ...eventsPrev];
      eventsRef.current = updated;
      return updated;
    });

    // Sync with backend and broadcast to all participants
    if (currentUser?.id) {
      // Persist to backend first, then broadcast only on success
      try {
        await api.saveEvent(currentUser.id, id, {
          ...target,
          archived: false,
          participants: target.participants || [],
        });
        
        // Only send socket broadcast after successful persistence
        if (socketRef.current && socketRef.current.connected) {
          const { sharedWith, ...eventWithoutSharedWith } = target;
          console.log(`[EventContext] Emitting unarchive socket update for event ${id}`);
          socketRef.current.emit('event:update', {
            eventId: id,
            eventData: {
              ...eventWithoutSharedWith,
              title: target.title,
              items: target.items || [],
              archived: false,
              participants: target.participants || [],
            },
          });
        } else {
          console.warn(`[EventContext] Socket not connected, cannot broadcast unarchive for event ${id}`);
        }
      } catch (err) {
        console.error('[EventContext] Failed to persist unarchive to backend:', err);
        // Reload events to restore state on error (rollback local state)
        reloadEvents();
        // Don't send socket broadcast since persistence failed
      }
    }
  };

  // Helper so screens can look up an event from either list
  const getEventById = (id) => {
    const event = events.find(e => e.id === id) || archivedEvents.find(e => e.id === id);
    
    // If no event found, return null
    if (!event) {
      return null;
    }
    
    // Verify user has access to this event
    // IMPORTANT: Only check sharedWith for access control, not participants
    // participants can include dummy friends who don't have access
    const normalizedCurrentUserId = currentUser?.id?.toLowerCase();
    if (!normalizedCurrentUserId) {
      return null; // No user logged in, no access
    }
    
    const eventSharedWith = event.sharedWith || [];
    const eventOwnerId = event.ownerId?.toLowerCase();
    
    const userIsOwner = eventOwnerId === normalizedCurrentUserId;
    const userIsInSharedWith = eventSharedWith.some(p => 
      normalizeUserId(p) === normalizeUserId(normalizedCurrentUserId)
    );
    const userHasAccess = userIsOwner || userIsInSharedWith;
    
    // Only return event if user has access
    if (!userHasAccess) {
      console.log(`[EventContext] getEventById: User ${normalizedCurrentUserId} does not have access to event ${id} (not in sharedWith and not owner)`);
      console.log(`[EventContext]   Event sharedWith: [${eventSharedWith.join(', ')}], ownerId: ${eventOwnerId}`);
      return null;
    }
    
    return event;
  };

  return (
    <EventContext.Provider
      value={{
        events,
        archivedEvents,
        addEvent,
        updateItems,
        updateParticipants,
        deleteEvent,
        archiveEvent,
        unarchiveEvent,
        getEventById,
        reloadEvents, // Expose reload function for manual refresh
        // shared friends state
        friends,
        setFriends,
        // profile state
        profile,
        setProfile,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
