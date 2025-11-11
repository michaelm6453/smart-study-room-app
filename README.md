# Smart Study Room Reservation App

A cross-platform mobile application that allows university students to search, reserve, and manage study rooms in real time.
Built with Expo, React Native, and TypeScript, and powered by Firebase for authentication and cloud data storage.
Final Project for Mobile Applications Class.

## Stack
- Expo (React Native tooling and dev runtime)
- React Native (mobile UI framework)
- TypeScript (type safety)
- Firebase Auth (email/password)
- Firestore (rooms, reservations) and Cloud Functions
- Firebase Admin SDK tooling (seeding scripts)

## Local setup

1. `npm install`
2. Create `.env` using your Firebase Web app config (see `.env` example).
3. In Firebase console, enable Authentication (Email/Password) and Firestore (native mode).
4. Populate Firestore following the schema below (or run the seeding script). If you want a jump start, open the Profile tab → Admin mode → “Seed Ontario Tech rooms” to create three demo rooms with coordinates and amenities.
5. Set `EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY` in `.env` with a Google Maps Static API key (used for previews/deep links).
6. Start the app with `npx expo start` and open it in Expo Go on a device on the same network.

### Firestore data model

```
rooms (collection)
  <roomId> (document)
    name: string
    building: string
    floor: string (optional)
    capacity: number
    amenities: string[]
    description: string (optional)
    openingHours: {
      start: string (e.g. "07:00")
      end: string (e.g. "23:00")
    }
    imageUrl: string (optional)
    location: {
      lat: number
      lng: number
      label: string (optional)
    }

rooms/<roomId>/reservations (sub-collection)
  <reservationId> (document)
    userId: string (auth uid)
    userEmail: string
    start: timestamp
    end: timestamp
    purpose: string | null
    photoUrl: string | null (room condition photo)
    status: "confirmed" | "cancelled"
    createdAt: timestamp (server)
    cancelledAt: timestamp (server | optional)
```

### App navigation overview

- **Browse** tab lists rooms with real-time updates, search, and quick filters.
- **Bookings** tab shows upcoming reservations and history for the signed-in user (cancel direct from the list).
- **Profile** tab surfaces account actions plus an "Admin mode" button that opens the room manager UI.

### Maps, media, and storage configuration

1. Enable Firebase Storage in the console and leave the default bucket that matches `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`.
2. For development, allow authenticated users to read/write to `/condition-photos/*`. Lock this down before production so only the booking owner can access their photos.
3. Generate a Google Maps Static API key, keep it unrestricted (or restrict by referrer later), and set `EXPO_PUBLIC_GOOGLE_MAPS_STATIC_KEY` in `.env`. The room detail screen uses this key to render map previews and deep links into Google Maps.

## Development Progress
- [x] Expo + TypeScript project initialized
- [x] File-based routing with (`expo-router`)
- [x] Firebase Auth wired
- [x] Firestore setup for rooms and bookings
- [x] Room list & booking UI
- [x] Admin room management UI (create/update/delete)
- [x] User booking history page
- [x] Room detail page (with book/cancel logic)
- [x] Google Maps integration (static preview + deep link)
- [x] Camera/photo upload for room condition check-ins
- [ ] Notifications

## Design Progress
- [x] Login/Sign Up UI implemented (simple but great starting point)
- [x] Mock UI designed
- [ ] Mock UI implemented

## Highlighted features
- Ontario Tech themed Browse screen with hero imagery plus room search/filtering.
- Room detail page shows static Google Maps previews with one-tap directions.
- Reservation flow supports attaching a “room condition” photo that uploads to Firebase Storage and appears in both the room timeline and the Bookings tab.

## Upcoming roadmap

### Camera accountability features
1. Harden Firebase Storage rules so only reservation owners can upload/view their condition photos.
2. Replace the gallery picker with an in-app camera flow (`ImagePicker.launchCameraAsync`) for on-the-spot documentation.
3. Extend the bookings detail view with multi-photo support and timestamps.

### Maps and navigation
1. Use `expo-location` to detect the user's current position for future “navigate from here” flows.
2. Swap the static preview with an interactive `MapView` that highlights every room on campus.
3. Maintain per-building metadata (entrance instructions, floor plans) and support indoor wayfinding.
