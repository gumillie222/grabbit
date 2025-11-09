# Grabbit – Realtime Shared Shopping List with AI Suggestions

Grabbit is a collaborative shopping list app prototype built with React Native (Expo) and a Node.js + Express + Socket.IO backend.
It demonstrates:
* Realtime updates across devices (via WebSockets)
* AI-powered item suggestions using OpenAI's API
* A clean, mobile-first UI for shared shopping planning

## Repository Structure

Grabbit/
├── Grabbit/                # React Native (Expo) frontend
│   ├── App.js
│   ├── RealtimeDemoScreen.js
│   ├── useRealtime.js
│   ├── StylesScreen.js
│   └── ...
│
└── realtime-server/        # Node.js backend (Express + Socket.IO + OpenAI)
    ├── server.js
    ├── package.json
    └── .env                # Contains OpenAI API key

## Prerequisites
* Xcode (for iOS simulator)
* An OpenAI API key from https://platform.openai.com/api-keys

## Setup Instructions

To run the app, first run the backend:
```
cd realtime-server
node server.js
```
You should see: Realtime + AI server running on port 3000

Then in a different terminal, run the frontend:
```
cd Grabbit
npm start
```

You can now choose one of the following:
* Option A – Web
- Press w in the terminal
- Runs in browser at http://localhost:8081

* Option B – iOS Simulator
- Press i in the terminal
- Runs on the Xcode iOS simulator
- Works directly with http://localhost:3000 backend


## Demo Flow

* In the app, describe your gathering (e.g., "Hotpot dinner for 5 friends").
* Tap Generate suggestions (AI proposes items like “thinly sliced beef, broth base, tofu, noodles")
* Select suggested items and add them to your shared list.
* Toggle urgent, claimed, or bought for each item.
* Open a second client (web or another simulator window), updates appear in realtime via WebSockets.
