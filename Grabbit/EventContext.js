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
  const [friends, setFriends] = useState([
    { id: 1, name: 'Amy',  phone: '555-111-2222', email: 'amy@example.com' },
    { id: 2, name: 'Ben',  phone: '555-333-4444', email: 'ben@example.com' },
    { id: 3, name: 'Chris', phone: '555-555-6666', email: 'chris@example.com' },
  ]);
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
        const response = await api.getFriends(currentUser.id);
        const backendFriends = response.friends || [];
        setFriends(backendFriends);
        console.log('[EventContext] Loaded', backendFriends.length, 'friends');
      } catch (err) {
        console.error('[EventContext] Failed to load friends from backend:', err);
        // Keep default friends on error
      }
    };

    loadFriendsFromBackend();
  }, [currentUser?.id]);

  // Function to reload events from backend (exposed for manual refresh)
  const reloadEvents = React.useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      console.log('[EventContext] Reloading events from backend for user:', currentUser.id);
      const response = await api.getEvents(currentUser.id);
      const backendEvents = response.events || [];
      
      // Convert backend events to app format
      // Convert current user's name to "Me" in participants
      const formattedEvents = backendEvents.map(e => {
        const participants = (e.participants || []).map(p => 
          p === currentUser.name ? 'Me' : p
        );
        return {
          id: e.id,
          title: e.title,
          items: e.items || [],
          participants: participants,
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
    reloadEvents().finally(() => {
      hasHydrated.current = true;
    });
  }, [currentUser?.id, reloadEvents]);

  // Set up socket connection for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

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
          const response = await api.getFriends(currentUser.id);
          setFriends(response.friends || []);
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

      // Convert current user's name to "Me" in participants
      const convertParticipants = (participants) => {
        if (!participants || !Array.isArray(participants)) return [];
        return participants.map(p => p === currentUser.name ? 'Me' : p);
      };

      // Update the event in our local state
      setEvents(prev => {
        const existingIndex = prev.findIndex(e => e.id === eventId);
        if (existingIndex >= 0) {
          // Update existing event
          const updated = [...prev];
          const eventDataParticipants = eventData.participants 
            ? convertParticipants(eventData.participants)
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
            participants: convertParticipants(eventData.participants || []),
            isNew: false,
            archived: false,
          }, ...prev];
        }
      });
    });

    return () => {
      socket.disconnect();
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
    const eventToAdd = {
      ...newEvent,
      items: newEvent.items ?? [],
      participants: newEvent.participants ?? ['Me'],
      isNew: true,
      archived: false,
    };

    setEvents(currentEvents => [eventToAdd, ...currentEvents]);

    // Sync with backend
    if (currentUser?.id) {
      try {
        // Convert "Me" back to current user's name for backend
        const participantsForBackend = eventToAdd.participants.map(p => 
          p === 'Me' ? currentUser.name : p
        );
        
        // Get friend IDs from participants (excluding "Me")
        const participantFriends = friends.filter(f => 
          participantsForBackend.includes(f.name)
        );
        const sharedWith = [currentUser.id, ...participantFriends.map(f => f.id)].filter(Boolean);
        
        console.log(`[EventContext] Creating event with participants: ${eventToAdd.participants.join(', ')}, sharedWith: ${sharedWith.join(', ')}`);
        console.log(`[EventContext] Found ${participantFriends.length} matching friends:`, participantFriends.map(f => `${f.name} (${f.id})`));
        
        await api.saveEvent(currentUser.id, newEvent.id, {
          title: eventToAdd.title,
          items: eventToAdd.items,
          participants: participantsForBackend,
          sharedWith,
        });
        
        // Send real-time update via socket (with actual names, not "Me")
        if (socketRef.current) {
          socketRef.current.emit('event:update', {
            eventId: newEvent.id,
            eventData: {
              title: eventToAdd.title,
              items: eventToAdd.items,
              participants: participantsForBackend,
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
          // Convert "Me" back to current user's name for backend
          const participantsForBackend = (event.participants || []).map(p => 
            p === 'Me' ? currentUser.name : p
          );
          
          await api.saveEvent(currentUser.id, eventId, {
            ...event,
            items: updatedItems,
            participants: participantsForBackend,
          });
          
          // Send real-time update via socket (with actual names, not "Me")
          if (socketRef.current) {
            socketRef.current.emit('event:update', {
              eventId,
              eventData: {
                ...event,
                items: updatedItems,
                participants: participantsForBackend,
              },
            });
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
          // Convert "Me" back to current user's name for backend
          const participantsForBackend = updatedParticipants.map(p => 
            p === 'Me' ? currentUser.name : p
          );
          
          // Don't send sharedWith - let backend resolve it from participants
          const { sharedWith, ...eventWithoutSharedWith } = event;
          
          await api.saveEvent(currentUser.id, eventId, {
            ...eventWithoutSharedWith,
            participants: participantsForBackend,
            // Let backend resolve sharedWith from participants
          });
          
          // Send real-time update via socket (with actual names, not "Me")
          // Don't send sharedWith - let backend resolve it from participants
          if (socketRef.current) {
            const { sharedWith: _, ...eventWithoutSharedWithSocket } = event;
            socketRef.current.emit('event:update', {
              eventId,
              eventData: {
                ...eventWithoutSharedWithSocket,
                participants: participantsForBackend,
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
