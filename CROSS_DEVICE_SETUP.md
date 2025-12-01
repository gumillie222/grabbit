# Cross-Device Communication Setup Guide

This guide explains how to set up and use cross-device communication with 2 accounts in Grabbit.

## Overview

The app now supports:
- **User Authentication**: Each device can log in as a different user
- **Friend Requests**: Send and accept friend requests between users
- **Real-time Communication**: Socket.IO-based real-time updates
- **User Presence**: See when friends are online/offline

## Setup Instructions

### 1. Start the Backend Server

```bash
cd realtime-server
npm install  # if not already done
node server.js
```

The server will run on `http://0.0.0.0:4000` (or the port specified in PORT env var).

**Important**: Make sure your mobile device/emulator can reach this server:
- For iOS Simulator: Use `http://localhost:4000`
- For Android Emulator: Use `http://10.0.2.2:4000`
- For physical devices: Use your computer's local IP (e.g., `http://10.0.0.162:4000`)

### 2. Server URL Configuration

The app automatically detects the platform and uses the correct server URL:
- **iOS Simulator**: `http://localhost:4000`
- **Android Emulator**: `http://10.0.2.2:4000`
- **Web/Other**: `http://localhost:4000`

This is configured in `Grabbit/config.js`. If you need to use a different IP (e.g., for physical devices on the same network), you can modify the `getServerUrl()` function in that file to return your computer's local IP address (e.g., `http://10.0.0.162:4000`).

### 3. Testing with 2 Accounts

#### Option A: Quick Login (Recommended for Testing)

1. **Device 1**: Open the app → Tap "Login as Alice"
2. **Device 2**: Open the app → Tap "Login as Bob"

#### Option B: Manual Login

1. **Device 1**: 
   - Name: `Alice`
   - Email: `alice@example.com`
   - Phone: `555-111-2222`

2. **Device 2**:
   - Name: `Bob`
   - Email: `bob@example.com`
   - Phone: `555-333-4444`

### 4. Adding Friends

1. On **Device 1** (Alice):
   - Go to "Me" tab
   - Tap "Add or manage friends"
   - Enter Bob's email (`bob@example.com`) or phone (`555-333-4444`)
   - Tap "Send friend request"

2. On **Device 2** (Bob):
   - Go to "Me" tab
   - Tap "Add or manage friends"
   - Switch to "Requests" tab
   - You should see Alice's friend request
   - Tap the checkmark to accept

3. Both devices will now show each other in their friends list!

## How It Works

### Backend Architecture

The server (`realtime-server/server.js`) maintains:
- **User Registry**: In-memory storage of all registered users
- **Friend Requests**: Pending, accepted, and declined requests
- **Friendships**: Bilateral friend relationships
- **Socket Connections**: Real-time WebSocket connections per user

### API Endpoints

- `POST /api/users/register` - Register/update user
- `POST /api/users/search` - Search users by email/phone
- `POST /api/friends/request` - Send friend request
- `GET /api/friends/requests/:userId` - Get friend requests
- `POST /api/friends/accept` - Accept friend request
- `POST /api/friends/decline` - Decline friend request
- `GET /api/friends/:userId` - Get friends list

### Socket Events

- `friend:request` - New friend request received
- `friend:accepted` - Friend request accepted
- `friend:declined` - Friend request declined
- `friend:presence` - Friend online/offline status changed
- `event:update` - Event data updated (for future use)

## Troubleshooting

### "Failed to connect to server"
- Check that the server is running
- Verify the SERVER_URL matches your network setup
- For physical devices, ensure both devices are on the same network
- Check firewall settings

### "User not found" when sending friend request
- Make sure the other user has logged in at least once (to register with backend)
- Verify the email/phone matches exactly

### Friend requests not appearing
- Check that both devices are connected to the server
- Verify socket connections are established (check server logs)
- Try refreshing the friend requests list

### Server crashes or data lost
- The current implementation uses in-memory storage
- Data is lost when the server restarts
- For production, integrate with a database (MongoDB, PostgreSQL, etc.)

## Next Steps

To extend this system:

1. **Database Integration**: Replace in-memory storage with a database
2. **Event Sharing**: Use `event:update` socket events to share events between friends
3. **Notifications**: Add push notifications for friend requests
4. **User Profiles**: Add profile pictures and more user details
5. **Groups**: Support for group events with multiple participants

## Files Modified/Created

### New Files:
- `Grabbit/UserContext.js` - User identity management (alternative to AuthContext)
- `Grabbit/api.js` - API helper functions
- `CROSS_DEVICE_SETUP.md` - This guide

### Modified Files:
- `Grabbit/AuthContext.js` - Updated to support user identity and backend registration
- `Grabbit/LoginScreen.js` - Updated for user registration instead of password auth
- `Grabbit/ProfileScreen.js` - Integrated with backend API for friend requests
- `Grabbit/useRealtime.js` - Added user identity support
- `realtime-server/server.js` - Added user management and friend request APIs

