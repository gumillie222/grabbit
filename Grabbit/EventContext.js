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
        console.log('[EventContext] Loading friends from backend for user:', currentUser.id);
        
        // Hardcode friends based on user name
        const userName = currentUser.name?.toLowerCase();
        let hardcodedFriends = [];
        
        if (userName === 'bob') {
          // Bob has only Alice as a friend
          hardcodedFriends = [
            { id: 'alice', name: 'Alice', phone: '555-111-2222', email: 'alice@example.com' },
          ];
        } else if (userName === 'alice') {
          // Alice has only Bob as a friend
          hardcodedFriends = [
            { id: 'bob', name: 'Bob', phone: '555-333-4444', email: 'bob@example.com' },
          ];
        } else {
          // For other users, try to load from backend
          const response = await api.getFriends(currentUser.id);
          hardcodedFriends = response.friends || [];
        }
        
        setFriends(hardcodedFriends);
        console.log('[EventContext] Loaded', hardcodedFriends.length, 'friends');
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
      console.log('[EventContext] Reloading events from backend for user:', currentUser.id);
      const response = await api.getEvents(currentUser.id);
      const backendEvents = response.events || [];
      
      // Convert backend events to app format - keep actual user names/IDs
      // Separate archived and active events
      const activeEvents = [];
      const archivedEventsList = [];
      
      backendEvents.forEach(e => {
        const formattedEvent = {
          id: e.id,
          title: e.title,
          items: e.items || [],
          participants: e.participants || [],
          isNew: false,
          archived: e.archived === true, // Preserve archived status from backend
        };
        
        if (formattedEvent.archived) {
          archivedEventsList.push(formattedEvent);
        } else {
          activeEvents.push(formattedEvent);
        }
      });
      
      setEvents(activeEvents);
      setArchivedEvents(archivedEventsList);
      // Keep refs in sync
      eventsRef.current = activeEvents;
      archivedEventsRef.current = archivedEventsList;
      console.log('[EventContext] Reloaded', activeEvents.length, 'active events and', archivedEventsList.length, 'archived events');
      return [...activeEvents, ...archivedEventsList];
    } catch (err) {
      console.error('[EventContext] Failed to reload events from backend:', err);
      console.error('[EventContext] Error details:', err.message);
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
      console.log('[EventContext] Disconnecting old socket before reconnecting...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      query: { userId: currentUser.id },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[EventContext] Socket connected for real-time updates');
    });

    // Listen for friend accepted events to reload friends list
    socket.on('friend:accepted', () => {
      console.log('[EventContext] Received friend:accepted signal, reloading friends...');
      const reloadFriends = async () => {
        if (!currentUser?.id) return;
        try {
          // Hardcode friends based on user name
          const userName = currentUser.name?.toLowerCase();
          let hardcodedFriends = [];
          
          if (userName === 'bob') {
            // Bob has only Alice as a friend
            hardcodedFriends = [
              { id: 'alice', name: 'Alice', phone: '555-111-2222', email: 'alice@example.com' },
            ];
          } else if (userName === 'alice') {
            // Alice has only Bob as a friend
            hardcodedFriends = [
              { id: 'bob', name: 'Bob', phone: '555-333-4444', email: 'bob@example.com' },
            ];
          } else {
            // For other users, try to load from backend
            const response = await api.getFriends(currentUser.id);
            hardcodedFriends = response.friends || [];
          }
          
          setFriends(hardcodedFriends);
          console.log('[EventContext] Reloaded friends after friend:accepted');
        } catch (err) {
          console.error('[EventContext] Failed to reload friends:', err);
        }
      };
      reloadFriends();
    });

    // Listen for reload signal from server (when default events are created or shared)
    socket.on('events:reload', () => {
      console.log('[EventContext] Received events:reload signal, reloading events...');
      // Use the shared reloadEvents function
      reloadEvents();
    });

    socket.on('event:delete', (payload) => {
      console.log('[EventContext] Received event delete:', payload);
      const { eventId, fromUserId } = payload;
      
      if (fromUserId === currentUser.id) {
        return; // Ignore our own deletions
      }

      // Remove event from both lists
      setEvents(prev => {
        const updated = prev.filter(e => e.id !== eventId);
        eventsRef.current = updated;
        return updated;
      });
      setArchivedEvents(prev => {
        const updated = prev.filter(e => e.id !== eventId);
        archivedEventsRef.current = updated;
        return updated;
      });
    });

    socket.on('event:update', (payload) => {
      console.log('[EventContext] Received event update:', payload);
      const { eventId, eventData, fromUserId } = payload;
      
      // Ignore our own updates (case-insensitive comparison)
      if (fromUserId && currentUser?.id && fromUserId.toLowerCase() === currentUser.id.toLowerCase()) {
        console.log('[EventContext] Ignoring own update for event:', eventId);
        return;
      }

      // Use refs to get current state without nested setState
      const currentEvents = eventsRef.current;
      const currentArchived = archivedEventsRef.current;
      
      const eventInEvents = currentEvents.find(e => e.id === eventId);
      const eventInArchived = currentArchived.find(e => e.id === eventId);
      const existingEvent = eventInEvents || eventInArchived;
      
      const isNowArchived = eventData.archived === true;
      const wasArchived = existingEvent?.archived === true;
      
      // Log archive status changes for debugging
      if (isNowArchived !== wasArchived) {
        console.log(`[EventContext] Archive status changed for event ${eventId}: ${wasArchived} -> ${isNowArchived} (from user: ${fromUserId})`);
      }
      
      // Build updated event
      const updatedEvent = existingEvent ? {
        ...existingEvent,
        ...eventData,
        items: eventData.items || existingEvent.items,
        participants: eventData.participants || existingEvent.participants,
        archived: eventData.archived !== undefined ? eventData.archived : existingEvent.archived,
      } : {
        id: eventId,
        title: eventData.title || 'Untitled',
        items: eventData.items || [],
        participants: eventData.participants || [],
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
      console.log('[EventContext] Cleaning up socket connection');
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
        console.log('[EventContext] Failed to save data:', err.message);
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
        
        console.log(`[EventContext] Creating event with participants (IDs): ${participantsWithUser.join(', ')}, sharedWith: ${sharedWith.join(', ')}`);
        
        await api.saveEvent(currentUser.id, newEvent.id, {
          title: eventToAdd.title,
          items: eventToAdd.items,
          participants: participantsWithUser, // Send IDs to backend
          sharedWith,
        });
        
        // Send real-time update via socket
        if (socketRef.current) {
          socketRef.current.emit('event:update', {
            eventId: newEvent.id,
            eventData: {
              title: eventToAdd.title,
              items: eventToAdd.items,
              participants: eventToAdd.participants,
            },
          });
        }
      } catch (err) {
        console.error('[EventContext] Failed to sync new event:', err);
      }
    }
  };

  const updateItems = async (eventId, updatedItems) => {
    const updater = list =>
      list.map(e => (e.id === eventId ? { ...e, items: updatedItems } : e));

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
        const event = events.find(e => e.id === eventId) || archivedEvents.find(e => e.id === eventId);
        if (event) {
          // Log items with sharedBy for debugging
          const itemsWithSharedBy = updatedItems.filter(item => Array.isArray(item.sharedBy) && item.sharedBy.length > 0);
          if (itemsWithSharedBy.length > 0) {
            console.log(`[EventContext] Updating items with sharedBy:`, itemsWithSharedBy.map(item => ({
              id: item.id,
              name: item.name,
              sharedBy: item.sharedBy
            })));
          }
          
          // Send real-time update via socket FIRST for immediate updates
          // Don't send sharedWith - let server compute it from participants
          if (socketRef.current && socketRef.current.connected) {
            const { sharedWith, ...eventWithoutSharedWith } = event;
            const payload = {
              eventId,
              eventData: {
                ...eventWithoutSharedWith,
                items: updatedItems,
                participants: event.participants || [],
              },
            };
            console.log(`[EventContext] Emitting event:update IMMEDIATELY for event ${eventId} with ${updatedItems.length} items`);
            // Log claimed items for debugging
            const claimedItems = updatedItems.filter(item => item.claimedBy);
            if (claimedItems.length > 0) {
              console.log(`[EventContext] Items with claims:`, claimedItems.map(item => ({
                id: item.id,
                name: item.name,
                claimedBy: item.claimedBy
              })));
            }
            socketRef.current.emit('event:update', payload);
            console.log(`[EventContext] Sent event:update for event ${eventId} with ${updatedItems.length} items, participants: ${(event.participants || []).join(', ')}`);
            if (itemsWithSharedBy.length > 0) {
              console.log(`[EventContext] Socket update includes items with sharedBy:`, itemsWithSharedBy.map(item => ({
                id: item.id,
                name: item.name,
                sharedBy: item.sharedBy
              })));
            }
          } else {
            console.warn(`[EventContext] Socket not connected, cannot send real-time update. Socket exists: ${!!socketRef.current}, Connected: ${socketRef.current?.connected}`);
          }
          
          // Persist to backend via REST API (in background, don't block)
          api.saveEvent(currentUser.id, eventId, {
            ...event,
            items: updatedItems,
            participants: event.participants || [],
          }).catch(err => {
            console.error('[EventContext] Failed to persist event to backend:', err);
            // Don't throw - socket update already sent, this is just persistence
          });
        }
      } catch (err) {
        console.error('[EventContext] Failed to sync items update:', err);
      }
    }
  };

  const updateParticipants = async (eventId, updatedParticipants) => {
    const updater = list =>
      list.map(e =>
        e.id === eventId ? { ...e, participants: updatedParticipants } : e
      );

    // Store previous state in case we need to rollback
    const previousEvents = [...events];
    const previousArchivedEvents = [...archivedEvents];

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
      try {
        await api.deleteEvent(currentUser.id, id);

        // Send real-time deletion via socket
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('event:delete', {
            eventId: id,
          });
          console.log(`[EventContext] Sent event:delete for event ${id}`);
        }
      } catch (err) {
        console.error('[EventContext] Failed to delete event:', err);
        // Optionally reload events to restore state on error
        reloadEvents();
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
      // Send real-time update via socket IMMEDIATELY for instant cross-device sync
      if (socketRef.current && socketRef.current.connected) {
        const { sharedWith, ...eventWithoutSharedWith } = target;
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
        console.log(`[EventContext] Sent archive event:update for event ${id} (real-time broadcast)`);
      } else {
        console.warn(`[EventContext] Socket not connected, cannot send real-time archive update for event ${id}`);
      }

      // Persist to backend (in background, don't block)
      try {
        await api.saveEvent(currentUser.id, id, {
          ...target,
          archived: true,
          participants: target.participants || [],
        });
      } catch (err) {
        console.error('[EventContext] Failed to persist archive to backend:', err);
        // Optionally reload events to restore state on error
        reloadEvents();
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
      // Send real-time update via socket IMMEDIATELY for instant cross-device sync
      if (socketRef.current && socketRef.current.connected) {
        const { sharedWith, ...eventWithoutSharedWith } = target;
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
        console.log(`[EventContext] Sent unarchive event:update for event ${id} (real-time broadcast)`);
      } else {
        console.warn(`[EventContext] Socket not connected, cannot send real-time unarchive update for event ${id}`);
      }

      // Persist to backend (in background, don't block)
      try {
        await api.saveEvent(currentUser.id, id, {
          ...target,
          archived: false,
          participants: target.participants || [],
        });
      } catch (err) {
        console.error('[EventContext] Failed to persist unarchive to backend:', err);
        // Optionally reload events to restore state on error
        reloadEvents();
      }
    }
  };

  // Helper so screens can look up an event from either list
  const getEventById = (id) =>
    events.find(e => e.id === id) ||
    archivedEvents.find(e => e.id === id) ||
    null;

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
