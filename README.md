# Grabbit – Realtime Shared Shopping List with AI Suggestions

Grabbit is a collaborative shopping-list prototype built with Expo (React Native) and a Node.js + Socket.IO backend. It demonstrates:
* Realtime updates across devices via WebSockets
* AI-powered shopping suggestions
* Lightweight friend management plus archiving workflows

## Prerequisites
* Node.js 18+
* Xcode (iOS simulator) and/or Android Studio (Android emulator) if you want to stay on one machine
* Expo CLI (`npm install -g expo-cli`) and the Expo Go app for physical devices
* Optional: an OpenAI API key for suggestion generation

## Running the Stack

1. **Start the backend server**
   ```bash
   cd realtime-server
   npm install            # first run only
   node server.js
   ```
   The server listens on `http://0.0.0.0:4000` and logs “Realtime + AI server running on port 4000”.

2. **Start the Expo app**
   ```bash
   cd Grabbit
   npm install            # first run only
   npm start
   ```
   * Press `i` to launch the iOS simulator, `a` for Android, or scan the QR code with Expo Go on a phone.
   * `config.js` automatically points to the Metro host IP for physical devices. If detection ever fails, update `FALLBACK_LOCAL_IP`.

## Cross-Device Testing

Grabbit shines when two users collaborate in realtime. Pick one of these flows:

1. Make sure all devices are on the same Wi-Fi network.
2. Scan the Expo QR code on both phones (or open two iOS simulators on laptop). The auto IP detection in `config.js` points each device back to your laptop's backend.
3. Log in as two different demo accounts (Alice/Bob). You can also switch accounts from the Profile tab without reinstalling.
4. Create an event or toggle claimed/bought flags on one phone, and the other receives updates immediately.


## Common Questions & Fixes

**Q: Socket connection keeps timing out. What now?**  
A: Confirm `node server.js` is running, your laptop and devices share Wi-Fi, and no VPN/firewall blocks port 4000. If you are on a release build without Expo metadata, set `FALLBACK_LOCAL_IP` in `Grabbit/config.js` to your machine's LAN IP.

**Q: AI suggestions fail with a 500 error.**  
A: Ensure `OPENAI_API_KEY` is defined in `realtime-server/.env`. If you don't need AI, failures are logged but the rest of the realtime workflow still works.

## Attributions

We used Cursor and Codex to help debug tricky issues and scaffold the initial backend syncing structure that powers realtime cross-device collaboration.
