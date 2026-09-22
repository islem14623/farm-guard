# Farm Guard Mobile

React Native app (Expo) for Farm Guard — connects to the live backend at
`https://farm-guard-backend.onrender.com`.

## What's included

- Login screen (JWT auth, token saved on device)
- Signup screen
- Dashboard: latest reading + history, pull-to-refresh, logout

## Setup (on your own machine)

1. Install Node.js if you don't have it: https://nodejs.org
2. Install the Expo CLI (one-time):
   ```bash
   npm install -g expo-cli
   ```
3. Install this project's dependencies:
   ```bash
   cd farm-guard-mobile
   npm install
   ```
4. Start the app:
   ```bash
   npx expo start
   ```
5. Install **Expo Go** on your phone (Android: Play Store, iOS: App Store).
6. Scan the QR code shown in your terminal/browser with the Expo Go app —
   the app opens live on your phone. Every code change reloads automatically.

## Notes

- The API URL lives in `api.js` — change it there if the backend moves.
- No push notifications yet — this is step 1 (basic app connected to the
  real backend). Push notifications (Firebase Cloud Messaging) come next,
  once this base app is confirmed working on your phone.
- Uses the exact same `/login`, `/signup`, `/my-readings` endpoints as the
  web frontend — no backend changes were needed for this app to work.
