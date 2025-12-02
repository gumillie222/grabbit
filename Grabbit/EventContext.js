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
      const formattedEvents = backendEvents.map(e => {
        return {
          id: e.id,
          title: e.title,
          items: e.items || [],
          participants: e.participants || [],
          isNew: false,
          archived: false,
        };
      });
      
      setEvents(formattedEvents);
      console.log('[EventContext] Reloaded', formattedEvents.length, 'events');
      return formattedEvents;
    } catch (err) {
      console.error('[EventContext] Failed to reload events from backend:', err);
      console.error('[EventContext] Error details:', err.message);
      setEvents([]);
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

    socket.on('event:update', (payload) => {
      console.log('[EventContext] Received event update:', payload);
      const { eventId, eventData, fromUserId } = payload;
      
      if (fromUserId === currentUser.id) {
        return; // Ignore our own updates
      }

      // Update the event in our local state - keep actual user names/IDs
      setEvents(prev => {
        const existingIndex = prev.findIndex(e => e.id === eventId);
        if (existingIndex >= 0) {
          // Update existing event
          const updated = [...prev];
          const eventDataParticipants = eventData.participants 
            ? eventData.participants
            : updated[existingIndex].participants;
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...eventData,
            items: eventData.items || updated[existingIndex].items,
            participants: eventDataParticipants,
          };
          return updated;
        } else {
          // Add new event
          return [{
            id: eventId,
            title: eventData.title,
            items: eventData.items || [],
            participants: eventData.participants || [],
            isNew: false,
            archived: false,
          }, ...prev];
        }
      });
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
    const participants = newEvent.participants ?? [];
    const participantsWithUser = participants.includes(currentUser?.name) 
      ? participants 
      : [currentUser?.name, ...participants].filter(Boolean);
    
    const eventToAdd = {
      ...newEvent,
      items: newEvent.items ?? [],
      participants: participantsWithUser,
      isNew: true,
      archived: false,
    };

    setEvents(currentEvents => [eventToAdd, ...currentEvents]);

    // Sync with backend
    if (currentUser?.id) {
      try {
        // Get friend IDs from participants
        const participantFriends = friends.filter(f => 
          eventToAdd.participants.includes(f.name)
        );
        const sharedWith = [currentUser.id, ...participantFriends.map(f => f.id)].filter(Boolean);
        
        console.log(`[EventContext] Creating event with participants: ${eventToAdd.participants.join(', ')}, sharedWith: ${sharedWith.join(', ')}`);
        console.log(`[EventContext] Found ${participantFriends.length} matching friends:`, participantFriends.map(f => `${f.name} (${f.id})`));
        
        await api.saveEvent(currentUser.id, newEvent.id, {
          title: eventToAdd.title,
          items: eventToAdd.items,
          participants: eventToAdd.participants,
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

    setEvents(prev => updater(prev));
    setArchivedEvents(prev => updater(prev));

    // Sync with backend
    if (currentUser?.id) {
      try {
        const event = events.find(e => e.id === eventId) || archivedEvents.find(e => e.id === eventId);
        if (event) {
          await api.saveEvent(currentUser.id, eventId, {
            ...event,
            items: updatedItems,
            participants: event.participants || [],
          });
          
          // Send real-time update via socket
          if (socketRef.current) {
            socketRef.current.emit('event:update', {
              eventId,
              eventData: {
                ...event,
                items: updatedItems,
                participants: event.participants || [],
              },
            });
            console.log(`[EventContext] Sent event:update for event ${eventId} with ${updatedItems.length} items`);
          }
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

    setEvents(prev => updater(prev));
    setArchivedEvents(prev => updater(prev));

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

  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setArchivedEvents(prev => prev.filter(e => e.id !== id));
  };

  const archiveEvent = (id) => {
    setEvents(prev => {
      const target = prev.find(e => e.id === id);
      if (!target) return prev;

      const archivedCopy = { ...target, archived: true };

      setArchivedEvents(archPrev => [archivedCopy, ...archPrev]);
      return prev.filter(e => e.id !== id);
    });
  };

  const unarchiveEvent = (id) => {
    setArchivedEvents(prev => {
      const target = prev.find(e => e.id === id);
      if (!target) return prev;

      const activeCopy = { ...target, archived: false };

      setEvents(eventsPrev => [activeCopy, ...eventsPrev]);
      return prev.filter(e => e.id !== id);
    });
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
