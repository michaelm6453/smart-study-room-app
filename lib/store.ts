// Firestore data layer: strongly typed helpers for rooms + reservations.
import type { DocumentData, DocumentSnapshot, QueryDocumentSnapshot } from "firebase/firestore";
import {
  Timestamp,
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type Room = {
  // Room documents live in /rooms and describe the study spaces.
  id: string;
  name: string;
  building: string;
  floor?: string;
  capacity: number;
  amenities: string[];
  description?: string;
  imageUrl?: string;
  openingHours?: {
    start: string;
    end: string;
  };
};

export type Reservation = {
  // Reservation sub-documents live under /rooms/{roomId}/reservations.
  id: string;
  roomId: string;
  userId: string;
  userEmail?: string | null;
  roomName?: string;
  building?: string;
  start: Date;
  end: Date;
  purpose?: string;
  status: "confirmed" | "cancelled";
  createdAt?: Date;
  cancelledAt?: Date;
};

export type ReservationInput = {
  start: Date;
  end: Date;
  purpose?: string;
};

export type RoomInput = {
  name: string;
  building: string;
  floor?: string;
  capacity?: number;
  amenities?: string[];
  description?: string;
  openingHours?: {
    start: string;
    end: string;
  };
  imageUrl?: string;
};

export type RoomUpdateInput = Partial<RoomInput>;

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

// Convenience helpers so we don't repeat path-building everywhere.
const roomsCollection = collection(db, "rooms");
const roomDoc = (roomId: string) => doc(roomsCollection, roomId);
const reservationCollection = (roomId: string) => collection(roomDoc(roomId), "reservations");

type RoomDocument = {
  name?: string;
  building?: string;
  floor?: string;
  capacity?: number;
  amenities?: string[];
  description?: string;
  imageUrl?: string;
  openingHours?: {
    start: string;
    end: string;
  };
};

type ReservationDocument = {
  userId: string;
  userEmail?: string | null;
  roomId?: string;
  roomName?: string;
  building?: string;
  start: Timestamp;
  end: Timestamp;
  purpose?: string | null;
  status?: "confirmed" | "cancelled";
  createdAt?: Timestamp;
  cancelledAt?: Timestamp;
};

// Convert raw Firestore data into our Room shape with sensible fallbacks.
const buildRoom = (id: string, data: RoomDocument): Room => {
  return {
    id,
    name: data.name ?? "Unnamed Room",
    building: data.building ?? "Unknown Building",
    floor: data.floor,
    capacity: data.capacity ?? 0,
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    description: data.description ?? undefined,
    imageUrl: data.imageUrl ?? undefined,
    openingHours: data.openingHours,
  };
};

const toRoom = (snapshot: QueryDocumentSnapshot<DocumentData>): Room => {
  const data = snapshot.data() as RoomDocument;
  return buildRoom(snapshot.id, data);
};

const fromRoomDoc = (snapshot: DocumentSnapshot<DocumentData>): Room => {
  const data = (snapshot.data() as RoomDocument) ?? {};
  return buildRoom(snapshot.id, data);
};

// Build a reservation object, including denormalised room info for history views.
const buildReservation = (id: string, roomId: string, data: ReservationDocument): Reservation => {
  return {
    id,
    roomId,
    userId: data.userId,
    userEmail: data.userEmail,
    roomName: data.roomName ?? undefined,
    building: data.building ?? undefined,
    start: toDate(data.start) ?? new Date(),
    end: toDate(data.end) ?? new Date(),
    purpose: data.purpose ?? undefined,
    status: data.status ?? "confirmed",
    createdAt: toDate(data.createdAt),
    cancelledAt: toDate(data.cancelledAt),
  };
};

const toReservation = (
  snapshot: QueryDocumentSnapshot<DocumentData>,
  roomId: string,
): Reservation => {
  const data = snapshot.data() as ReservationDocument;
  return buildReservation(snapshot.id, roomId, data);
};

// Firestore may send timestamps, ISO strings, or Date objects depending on context.
const toDate = (value: unknown): Date | undefined => {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  return undefined;
};

export async function fetchRooms(): Promise<Room[]> {
  // One-off fetch for initial population before the realtime listener kicks in.
  const snapshot = await getDocs(query(roomsCollection, orderBy("name", "asc")));
  return snapshot.docs.map(toRoom);
}

// Normalise user input so Firestore gets predictable values for optional fields.
const normalizeRoomInput = (input: RoomInput | RoomUpdateInput, options?: { partial?: boolean }) => {
  const partial = options?.partial ?? false;
  const normalizeString = (value: unknown) => {
    if (value === undefined) {
      return undefined;
    }
    if (typeof value !== "string") {
      return value;
    }
    const trimmed = value.trim();
    return trimmed.length === 0 ? null : trimmed;
  };

  const normalizeCapacity = (value: unknown) => {
    if (value === undefined) {
      return partial ? undefined : 0;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric) || numeric < 0) {
      return partial ? undefined : 0;
    }

    return Math.floor(numeric);
  };

  const inputOpeningHours = input.openingHours;
  const normalizeOpeningHours = () => {
    if (inputOpeningHours === undefined) {
      return partial ? undefined : null;
    }
    if (!inputOpeningHours) {
      return null;
    }

    const start = normalizeString(inputOpeningHours.start);
    const end = normalizeString(inputOpeningHours.end);

    if (typeof start !== "string" || typeof end !== "string") {
      return null;
    }

    return { start, end };
  };

  const payload: Record<string, unknown> = {
    name: normalizeString(input.name),
    building: normalizeString(input.building),
    floor: normalizeString(input.floor),
    capacity: normalizeCapacity(input.capacity),
    amenities: Array.isArray(input.amenities)
      ? input.amenities.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : undefined,
    description: normalizeString(input.description),
    openingHours: normalizeOpeningHours(),
    imageUrl: normalizeString(input.imageUrl),
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  return payload;
};

export async function createRoom(input: RoomInput, options?: { id?: string }) {
  // Create a new room document, optionally respecting a caller-provided ID.
  if (!input.name?.trim() || !input.building?.trim()) {
    throw new Error("Room name and building are required.");
  }

  const payload = normalizeRoomInput(input, { partial: false });

  if (options?.id) {
    await setDoc(doc(roomsCollection, options.id), payload);
    return options.id;
  }

  const docRef = await addDoc(roomsCollection, payload);
  return docRef.id;
}

export async function updateRoom(roomId: string, updates: RoomUpdateInput) {
  // Partial updates let us tweak a few fields without rebuilding the document.
  const payload = normalizeRoomInput(updates, { partial: true });
  await updateDoc(roomDoc(roomId), payload);
}

export async function deleteRoom(roomId: string) {
  // Cascade delete reservations so we don't leave orphaned history around.
  const reservationsSnap = await getDocs(reservationCollection(roomId));
  const batch = writeBatch(db);

  reservationsSnap.forEach((resDoc) => {
    batch.delete(resDoc.ref);
  });

  batch.delete(roomDoc(roomId));
  await batch.commit();
}

export async function fetchRoom(roomId: string): Promise<Room | null> {
  // Helper for detail screens that need one room document.
  const snapshot = await getDoc(roomDoc(roomId));
  if (!snapshot.exists()) {
    return null;
  }

  return fromRoomDoc(snapshot);
}

export function observeRooms(onChange: (rooms: Room[]) => void, onError?: (error: Error) => void) {
  // Subscribe to room changes ordered alphabetically.
  return onSnapshot(
    query(roomsCollection, orderBy("name", "asc")),
    {
      next: (snapshot) => {
        onChange(snapshot.docs.map(toRoom));
      },
      error: (error) => {
        if (onError) {
          onError(error as Error);
        }
      },
    },
  );
}

export function observeReservations(
  roomId: string,
  start: Date,
  end: Date,
  onChange: (reservations: Reservation[]) => void,
  onError?: (error: Error) => void,
) {
  // Watch reservations within the provided window for a single room.
  const q = query(
    reservationCollection(roomId),
    orderBy("start", "asc"),
    where("start", ">=", Timestamp.fromDate(start)),
    where("start", "<", Timestamp.fromDate(end)),
  );

  return onSnapshot(
    q,
    {
      next: (snapshot) => {
        onChange(snapshot.docs.map((docSnapshot) => toReservation(docSnapshot, roomId)));
      },
      error: (error) => {
        if (onError) {
          onError(error as Error);
        }
      },
    },
  );
}

export async function fetchReservations(roomId: string, start: Date, end: Date) {
  // One-off fetch of reservations for screens that need snapshot data.
  const q = query(
    reservationCollection(roomId),
    orderBy("start", "asc"),
    where("start", ">=", Timestamp.fromDate(start)),
    where("start", "<", Timestamp.fromDate(end)),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnapshot) => toReservation(docSnapshot, roomId));
}

export async function createReservation(room: Room, input: ReservationInput) {
  const roomId = room.id;
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in to reserve a room.");
  }

  if (input.end <= input.start) {
    throw new Error("Reservation end time must be after the start time.");
  }

  const reservationsRef = reservationCollection(roomId);
  const overlappingQuery = query(
    reservationsRef,
    orderBy("start", "asc"),
    where("start", "<", Timestamp.fromDate(input.end)),
  );

  const overlapSnapshot = await getDocs(overlappingQuery);
  const conflict = overlapSnapshot.docs.some((docSnapshot) => {
    const data = docSnapshot.data() as Record<string, any>;
    const existingStart = toDate(data.start);
    const existingEnd = toDate(data.end);

    if (!existingStart || !existingEnd) {
      return false;
    }

    // Overlap happens when an existing reservation ends after our start time.
    return existingEnd > input.start;
  });

  if (conflict) {
    throw new BookingConflictError("That time overlaps an existing reservation.");
  }

  await addDoc(reservationsRef, {
    userId: user.uid,
    userEmail: user.email,
    roomId,
    roomName: room.name,
    building: room.building,
    start: Timestamp.fromDate(input.start),
    end: Timestamp.fromDate(input.end),
    purpose: input.purpose?.trim() || null,
    status: "confirmed",
    createdAt: serverTimestamp(),
  });
}

export async function cancelReservation(roomId: string, reservationId: string) {
  // Flip the status instead of deleting so we retain history.
  const reservationRef = doc(reservationCollection(roomId), reservationId);
  await updateDoc(reservationRef, {
    status: "cancelled",
    cancelledAt: serverTimestamp(),
  });
}

// collectionGroup snapshots don't expose the parent id, so we grab it manually.
const extractRoomIdFromSnapshot = (snapshot: QueryDocumentSnapshot<DocumentData> | DocumentSnapshot<DocumentData>) =>
  snapshot.ref.parent.parent?.id ?? (snapshot.data()?.roomId as string | undefined) ?? "";

const toReservationFromCollectionGroup = (snapshot: QueryDocumentSnapshot<DocumentData>): Reservation => {
  const data = snapshot.data() as ReservationDocument;
  const parentRoomId = extractRoomIdFromSnapshot(snapshot);
  return buildReservation(snapshot.id, parentRoomId, data);
};

export function observeUserReservations(
  userId: string,
  onChange: (reservations: Reservation[]) => void,
  onError?: (error: Error) => void,
) {
  // Collection group query lets us pull reservations across all rooms by userId.
  const q = query(
    collectionGroup(db, "reservations"),
    where("userId", "==", userId),
    orderBy("start", "asc"),
  );

  return onSnapshot(
    q,
    {
      next: (snapshot) => {
        onChange(snapshot.docs.map(toReservationFromCollectionGroup));
      },
      error: (error) => {
        if (onError) {
          onError(error as Error);
        }
      },
    },
  );
}

export async function fetchUserReservations(userId: string) {
  // Mirror of the observer for pull-to-refresh scenarios.
  const q = query(
    collectionGroup(db, "reservations"),
    where("userId", "==", userId),
    orderBy("start", "asc"),
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(toReservationFromCollectionGroup);
}