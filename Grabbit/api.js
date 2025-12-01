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

  searchUsers: async (email, phone) => {
    const response = await fetch(`${SERVER_URL}/api/users/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone }),
    });
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
  },

  // Friend request endpoints
  sendFriendRequest: async (fromUserId, toUserId) => {
    const response = await fetch(`${SERVER_URL}/api/friends/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromUserId, toUserId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send friend request');
    }
    return response.json();
  },

  getFriendRequests: async (userId) => {
    const response = await fetch(`${SERVER_URL}/api/friends/requests/${userId}`);
    if (!response.ok) throw new Error('Failed to get friend requests');
    return response.json();
  },

  acceptFriendRequest: async (requestId, userId) => {
    const response = await fetch(`${SERVER_URL}/api/friends/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, userId }),
    });
    if (!response.ok) throw new Error('Failed to accept friend request');
    return response.json();
  },

  declineFriendRequest: async (requestId, userId) => {
    const response = await fetch(`${SERVER_URL}/api/friends/decline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, userId }),
    });
    if (!response.ok) throw new Error('Failed to decline friend request');
    return response.json();
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
    if (!response.ok) throw new Error('Failed to save event');
    return response.json();
  },
};

