// EventContext.js
import React, { createContext, useState } from 'react';
import eventsData from './data.json';

export const EventContext = createContext();

export const EventProvider = ({ children }) => {
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
      }}
    >
      {children}
    </EventContext.Provider>
  );
};
