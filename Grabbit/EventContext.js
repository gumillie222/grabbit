// EventContext.js
import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import eventsData from './data.json';

export const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const STORAGE_KEY = 'grabbit:data:v1';

  // Active events (home)
  const [events, setEvents] = useState(
    eventsData.map(e => ({
      ...e,
      isNew: false,
      archived: false,
    }))
  );

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

  // Load persisted data once
  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.events) setEvents(parsed.events);
          if (parsed.archivedEvents) setArchivedEvents(parsed.archivedEvents);
          if (parsed.friends) setFriends(parsed.friends);
          if (parsed.profile) setProfile(parsed.profile);
        }
      } catch (err) {
        console.log('[EventContext] Failed to load persisted data:', err.message);
      } finally {
        hasHydrated.current = true;
      }
    };
    load();
  }, []);

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

  const addEvent = (newEvent) => {
    setEvents(currentEvents => [
      {
        ...newEvent,
        // keep what caller passed, but provide safe defaults
        items: newEvent.items ?? [],
        participants: newEvent.participants ?? ['Me'],
        isNew: true,
        archived: false,
      },
      ...currentEvents,
    ]);
  };

  const updateItems = (eventId, updatedItems) => {
    const updater = list =>
      list.map(e => (e.id === eventId ? { ...e, items: updatedItems } : e));

    setEvents(prev => updater(prev));
    setArchivedEvents(prev => updater(prev));
  };

  const updateParticipants = (eventId, updatedParticipants) => {
    const updater = list =>
      list.map(e =>
        e.id === eventId ? { ...e, participants: updatedParticipants } : e
      );

    setEvents(prev => updater(prev));
    setArchivedEvents(prev => updater(prev));
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
