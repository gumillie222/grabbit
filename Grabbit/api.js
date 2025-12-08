// api.js - API helper functions for backend communication
import { SERVER_URL } from './config';

export const api = {
  // User endpoints
  registerUser: async (userData) => {
    const response = await fetch(`${SERVER_URL}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) throw new Error('Failed to register user');
    return response.json();
  },

  // Hardcoded for demo - user search always returns empty
  searchUsers: async (email, phone) => {
    // Return empty for demo
    return { users: [] };
  },

  // Hardcoded for demo - friend requests always return empty
  getFriendRequests: async (userId) => {
    return { sent: [], received: [] };
  },

  // Hardcoded for demo - sending friend request does nothing
  sendFriendRequest: async (fromUserId, toUserId) => {
    // Simulate success but do nothing
    return { request: { id: 'stub', fromUserId, toUserId, status: 'pending', createdAt: Date.now() } };
  },

  // Hardcoded for demo - accepting friend request does nothing
  acceptFriendRequest: async (requestId, userId) => {
    // Simulate success but do nothing
    return { success: true };
  },

  // Hardcoded for demo - declining friend request does nothing
  declineFriendRequest: async (requestId, userId) => {
    // Simulate success but do nothing
    return { success: true };
  },

  getFriends: async (userId) => {
    const response = await fetch(`${SERVER_URL}/api/friends/${userId}`);
    if (!response.ok) throw new Error('Failed to get friends');
    return response.json();
  },

  // Event endpoints
  getEvents: async (userId) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/events/${userId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[API] getEvents failed: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to get events: ${response.status} ${response.statusText}`);
      }
      return response.json();
    } catch (err) {
      console.error('[API] getEvents error:', err);
      throw err;
    }
  },

  getEvent: async (userId, eventId) => {
    const response = await fetch(`${SERVER_URL}/api/events/${userId}/${eventId}`);
    if (!response.ok) throw new Error('Failed to get event');
    return response.json();
  },

  saveEvent: async (userId, eventId, eventData) => {
    const response = await fetch(`${SERVER_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, eventId, eventData }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] saveEvent failed: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Failed to save event: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  deleteEvent: async (userId, eventId) => {
    // Use query parameter for DELETE request (more reliable than body)
    const response = await fetch(`${SERVER_URL}/api/events/${eventId}?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errorText = await response.text();
      // Only log non-404 errors (404 is expected for events that don't exist)
      if (response.status !== 404) {
        console.error(`[API] deleteEvent failed: ${response.status} ${response.statusText}`, errorText);
      }
      throw new Error(`Failed to delete event: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },
};

