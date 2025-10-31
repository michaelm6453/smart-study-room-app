// Room detail screen handles metadata display, booking creation, and cancelling.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useLocalSearchParams, router } from "expo-router";
import { auth } from "../../../lib/firebase";
import {
  BookingConflictError,
  Room,
  Reservation,
  cancelReservation,
  createReservation,
  fetchRoom,
  observeReservations,
} from "../../../lib/store";
import Screen from "../../../components/Screen";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { colors, spacing, radius, type } from "../../../lib/theme";

const RESERVATION_WINDOW_DAYS = 7;
const RESERVATION_INCREMENT_MINUTES = 30;

export default function RoomDetailsScreen() {
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationsError, setReservationsError] = useState<string | null>(null);

  const [purpose, setPurpose] = useState("");
  const [start, setStart] = useState(() => getDefaultStart());
  const [end, setEnd] = useState(() => getDefaultEnd(getDefaultStart()));
  const [creating, setCreating] = useState(false);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (!roomId || typeof roomId !== "string") {
      setRoomError("Missing room identifier.");
      setLoadingRoom(false);
      return;
    }

    setLoadingRoom(true);
    fetchRoom(roomId)
      .then((data) => {
        setRoom(data);
        if (!data) {
          setRoomError("Room not found. It may have been removed.");
        } else {
          setRoomError(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load room", err);
        setRoomError("Unable to load room details. Please try again.");
      })
      .finally(() => setLoadingRoom(false));
  }, [roomId]);

  useEffect(() => {
    if (!roomId || typeof roomId !== "string") {
      return;
    }

    // Watch reservations for this room so the list below updates live.
    const rangeStart = startOfDay(new Date());
    const rangeEnd = endOfDay(addDays(rangeStart, RESERVATION_WINDOW_DAYS));

    const unsubscribe = observeReservations(
      roomId,
      rangeStart,
      rangeEnd,
      (nextReservations) => {
        setReservations(nextReservations);
        setReservationsError(null);
      },
      (err) => {
        console.error("Failed to observe reservations", err);
        setReservationsError("Realtime updates unavailable. Pull to refresh later.");
      },
    );

    return () => unsubscribe();
  }, [roomId]);

  const confirmedReservations = useMemo(
    () => reservations.filter((res) => res.status === "confirmed"),
    [reservations],
  );

  const onChangeStart = useCallback(
    (_: DateTimePickerEvent, selected?: Date) => {
      if (selected) {
        const rounded = roundToIncrement(selected, RESERVATION_INCREMENT_MINUTES);
        setStart(rounded);
        if (rounded >= end) {
          setEnd(addMinutes(rounded, 60));
        }
      }
      if (Platform.OS !== "ios") setShowStartPicker(false);
    },
    [end],
  );

  const onChangeEnd = useCallback(
    (_: DateTimePickerEvent, selected?: Date) => {
      if (selected) {
        const rounded = roundToIncrement(selected, RESERVATION_INCREMENT_MINUTES);
        if (rounded <= start) {
          setEnd(addMinutes(start, 60));
        } else {
          setEnd(rounded);
        }
      }
      if (Platform.OS !== "ios") setShowEndPicker(false);
    },
    [start],
  );

  const handleCreateReservation = useCallback(async () => {
    if (!roomId || typeof roomId !== "string" || !room) {
      Alert.alert("Missing room", "Cannot create a reservation without room details.");
      return;
    }

    setCreating(true);
    try {
      // Create the reservation with embedded room metadata for history views.
      await createReservation(room, { start, end, purpose: purpose.trim() || undefined });
      setPurpose("");
      Alert.alert("Reservation confirmed", "Your reservation has been created.");
    } catch (err: any) {
      if (err instanceof BookingConflictError) {
        Alert.alert("Time unavailable", err.message);
      } else {
        console.error("Reservation failed", err);
        Alert.alert("Reservation failed", err.message || "Please try again.");
      }
    } finally {
      setCreating(false);
    }
  }, [end, purpose, roomId, room, start]);

  const handleCancelReservation = useCallback(
    (reservationId: string) => {
      if (!roomId || typeof roomId !== "string") {
        return;
      }

      // Give the user a chance to back out before releasing the slot.
      Alert.alert("Cancel reservation?", "This action cannot be undone.", [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelReservation(roomId, reservationId);
              Alert.alert("Reservation cancelled");
            } catch (err) {
              console.error("Cancel failed", err);
              Alert.alert("Unable to cancel", "Please try again.");
            }
          },
        },
      ]);
    },
    [roomId],
  );

  const userId = auth.currentUser?.uid;

  return (
    <Screen>
      {loadingRoom ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <View style={{ height: spacing.sm }} />
          <Text style={[type.small, styles.loadingText]}>Loading room…</Text>
        </View>
      ) : roomError ? (
        <View style={styles.errorCard}>
          <Text style={[type.body, styles.errorTitle]}>We hit a snag</Text>
          <Text style={[type.small, styles.errorMessage]}>{roomError}</Text>
          <Button title="Back to rooms" variant="secondary" onPress={() => router.back()} />
        </View>
      ) : room ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={[type.h1, styles.roomTitle]}>{room.name}</Text>
            <Text style={[type.small, styles.roomMeta]}>
              {room.building}
              {room.floor ? ` · ${room.floor}` : ""}
            </Text>
            <View style={{ height: spacing.sm }} />
            <Text style={[type.body, styles.roomCapacity]}>
              Capacity:{" "}
              <Text style={styles.roomCapacityValue}>
                {room.capacity > 0 ? `${room.capacity} seats` : "Flexible"}
              </Text>
            </Text>
            {room.description ? (
              <Text style={[type.small, styles.roomDescription]}>{room.description}</Text>
            ) : null}
            {room.amenities.length > 0 ? (
              <View style={styles.badgeRow}>
                {room.amenities.map((amenity) => (
                  <View key={amenity} style={styles.badge}>
                    <Text style={[type.small, styles.badgeText]}>{amenity}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {room.openingHours ? (
              <Text style={[type.small, styles.roomHours]}>
                Hours: {room.openingHours.start} – {room.openingHours.end}
              </Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={[type.h2, styles.sectionTitle]}>Book a time</Text>
            <Text style={[type.small, styles.sectionSubtitle]}>
              Reservations are limited to {RESERVATION_WINDOW_DAYS} days out in this alpha build.
            </Text>

            <View style={{ height: spacing.md }} />

            <Text style={[type.small, styles.label]}>Purpose (optional)</Text>
            <Input placeholder="Group study, exam prep, etc." value={purpose} onChangeText={setPurpose} />

            <View style={{ height: spacing.md }} />

            <Text style={[type.small, styles.label]}>Start</Text>
            <Button
              title={formatDateTime(start)}
              variant="secondary"
              onPress={() => setShowStartPicker(true)}
            />
            {showStartPicker ? (
              <DateTimePicker
                value={start}
                onChange={onChangeStart}
                mode="datetime"
                minuteInterval={RESERVATION_INCREMENT_MINUTES}
              />
            ) : null}

            <View style={{ height: spacing.md }} />

            <Text style={[type.small, styles.label]}>End</Text>
            <Button title={formatDateTime(end)} variant="secondary" onPress={() => setShowEndPicker(true)} />
            {showEndPicker ? (
              <DateTimePicker
                value={end}
                onChange={onChangeEnd}
                mode="datetime"
                minuteInterval={RESERVATION_INCREMENT_MINUTES}
              />
            ) : null}

            <View style={{ height: spacing.md }} />

            <Button
              title={creating ? "Creating..." : "Reserve room"}
              onPress={handleCreateReservation}
              disabled={creating}
              style={styles.primaryButton}
            />
          </View>

          <View style={styles.card}>
            <Text style={[type.h2, styles.sectionTitle]}>Upcoming reservations</Text>
            {reservationsError ? (
              <Text style={[type.small, styles.reservationError]}>{reservationsError}</Text>
            ) : null}

            {confirmedReservations.length === 0 ? (
              <Text style={[type.small, styles.emptyState]}>
                No bookings scheduled. Be the first to reserve this room!
              </Text>
            ) : (
              confirmedReservations.map((reservation) => {
                const ownedByUser = reservation.userId === userId;
                const isPast = reservation.end <= new Date();
                return (
                  <View key={reservation.id} style={styles.reservationRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[type.body, styles.reservationTime]}>{formatReservation(reservation)}</Text>
                      <Text style={[type.small, styles.reservationMeta]}>
                        Reserved by {reservation.userEmail || "another student"}
                      </Text>
                      {reservation.purpose ? (
                        <Text style={[type.small, styles.reservationPurpose]}>{reservation.purpose}</Text>
                      ) : null}
                    </View>
                    {ownedByUser && !isPast ? (
                      <Button
                        title="Cancel"
                        variant="danger"
                        onPress={() => handleCancelReservation(reservation.id)}
                        style={styles.cancelBtn}
                      />
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      ) : null}
    </Screen>
  );
}

function getDefaultStart() {
  const now = new Date();
  return roundToIncrement(addMinutes(now, 30), RESERVATION_INCREMENT_MINUTES);
}

function getDefaultEnd(startValue: Date) {
  return addMinutes(startValue, 60);
}

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

function roundToIncrement(date: Date, incrementMinutes: number) {
  const ms = 1000 * 60 * incrementMinutes;
  return new Date(Math.ceil(date.getTime() / ms) * ms);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateTime(date: Date) {
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function formatReservation(reservation: Reservation) {
  const { start, end } = reservation;
  const sameDay = start.toDateString() === end.toDateString();
  const dayLabel = start.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  const startLabel = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endLabel = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay ? `${dayLabel} · ${startLabel} - ${endLabel}` : `${dayLabel} · ${startLabel} → ${endLabel}`;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: colors.subtext },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  roomTitle: { color: colors.text },
  roomMeta: { color: colors.subtext },
  roomCapacity: { color: colors.subtext },
  roomCapacityValue: { color: colors.text },
  roomDescription: { color: colors.subtext },
  roomHours: { color: colors.subtext },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  badge: {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
  },
  badgeText: { color: colors.subtext },
  sectionTitle: { color: colors.text },
  sectionSubtitle: { color: colors.subtext },
  label: { color: colors.subtext, marginBottom: spacing.xs / 2 },
  primaryButton: { marginTop: spacing.md },
  errorCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorTitle: { color: colors.text },
  errorMessage: { color: colors.subtext },
  reservationError: { color: colors.subtext },
  emptyState: { color: colors.subtext, marginTop: spacing.sm },
  reservationRow: {
    flexDirection: "row",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    alignItems: "center",
  },
  reservationTime: { color: colors.text },
  reservationMeta: { color: colors.subtext },
  reservationPurpose: { color: colors.subtext, fontStyle: "italic" },
  cancelBtn: { minWidth: 90 },
});