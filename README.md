# Smart Study Room Reservation App

A cross-platform mobile application that allows university students to search, reserve, and manage study rooms in real time.
Built with Expo, React Native, and TypeScript, and powered by Firebase for authentication and cloud data storage.
Final Project for Mobile Applications Class.

## Stack
- Expo (React Native tooling and dev runtime)
- React Native (mobile UI framework)
- TypeScript (type safety)
- Firebase Auth (email/password)
- Firestore (rooms, reservations) and Cloud Functions (planned)
- Firebase Admin SDK tooling (seeding scripts)

## Local setup

1. `npm install`
2. Create `.env` using your Firebase Web app config (see `.env` example).
3. In Firebase console, enable Authentication (Email/Password) and Firestore (native mode).
4. Populate Firestore following the schema below (or run the seeding script).
5. Start the app with `npx expo start` and open it in Expo Go on a device on the same network.

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

rooms/<roomId>/reservations (sub-collection)
  <reservationId> (document)
    userId: string (auth uid)
    userEmail: string
    start: timestamp
    end: timestamp
    purpose: string | null
    status: "confirmed" | "cancelled"
    createdAt: timestamp (server)
    cancelledAt: timestamp (server | optional)
```

### App navigation overview

- **Browse** tab lists rooms with real-time updates, search, and quick filters.
- **Bookings** tab shows upcoming reservations and history for the signed-in user (cancel direct from the list).
- **Profile** tab surfaces account actions plus an "Admin mode" button that opens the room manager UI.

## Development Progress
- [x] Expo + TypeScript project initialized
- [x] File-based routing with (`expo-router`)
- [x] Firebase Auth wired
- [x] Firestore setup for rooms and bookings
- [x] Room list & booking UI
- [x] Admin room management UI (create/update/delete)
- [x] User booking history page
- [x] Room detail page (with book/cancel logic)
- [ ] Google Maps integration
- [ ] Camera/photo upload
- [ ] Notifications



## Design Progress
- [x] Login/Sign Up UI implemented (simple but great starting point)
- [x] Mock UI designed
- [ ] Mock UI implemented

## Upcoming roadmap

### Camera accountability features
1. Add storage rules + Firebase Storage integration for room condition photos.
2. Introduce a check-in flow that prompts for an optional photo upload (using `expo-image-picker`).
3. Attach photo metadata to reservations and show thumbnails in the booking detail view.

### Maps and navigation
1. Add Google Maps API key to `.env` (`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`).
2. Use `expo-location` to request device location and display building pins on a Map screen.
3. Integrate the `expo-router` stack with a `MapView` to show reserved room location + directions launcher (Google/Apple Maps intent).
4. Future enhancement: maintain per-room lat/lng info in Firestore and support indoor navigation waypoints.