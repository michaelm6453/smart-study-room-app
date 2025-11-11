// Bookings tab: shows upcoming + past reservations for the signed-in user.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import { colors, spacing, radius, type } from "../../lib/theme";
import {
  Reservation,
  cancelReservation,
  fetchUserReservations,
  observeUserReservations,
} from "../../lib/store";
import { auth } from "../../lib/firebase";

export default function BookingsScreen() {
  const user = auth.currentUser;
  const userId = user?.uid;
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setReservations([]);
      return;
    }

    // Listen for reservations updates across all rooms using a collection group query.
    const unsubscribe = observeUserReservations(
      userId,
      (next) => {
        setReservations(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("observeUserReservations error", err);
        setError("Realtime updates unavailable. Pull to refresh.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      return;
    }
    setRefreshing(true);
    try {
      const snapshot = await fetchUserReservations(userId);
      setReservations(snapshot);
      setError(null);
    } catch (err) {
      console.error("Failed to refresh reservations", err);
      setError("Unable to refresh reservations. Try again.");
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const upcoming = useMemo(() => {
    // Only keep confirmed reservations that end in the future.
    const now = new Date();
    return reservations.filter((res) => res.end >= now && res.status === "confirmed");
  }, [reservations]);

  const past = useMemo(() => {
    const now = new Date();
    return reservations.filter((res) => res.end < now || res.status === "cancelled");
  }, [reservations]);

  const onCancel = useCallback((reservation: Reservation) => {
    Alert.alert(
      "Cancel reservation?",
      `Cancel your booking for ${reservation.roomName ?? "this room"}?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelReservation(reservation.roomId, reservation.id);
            } catch (err) {
              console.error("cancelReservation failed", err);
              Alert.alert("Unable to cancel", "Please try again.");
            }
          },
        },
      ],
    );
  }, []);

  const openRoom = useCallback((roomId: string) => {
    router.push({
      pathname: "/(main)/(rooms)/[roomId]",
      params: { roomId },
    });
  }, []);

  if (!userId) {
    return (
      <Screen>
        <View style={styles.centerMessage}>
          <Text style={[type.body, styles.emptyTitle]}>No account found</Text>
          <Text style={[type.small, styles.emptyText]}>
            Sign in to view your reservations and manage upcoming bookings.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={[{ key: "upcoming" }, { key: "past" }]}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) =>
          item.key === "upcoming" ? (
            <ReservationSection
              title="Upcoming"
              reservations={upcoming}
              loading={loading}
              onCancel={onCancel}
              onOpenRoom={openRoom}
              emptyMessage="You have no upcoming reservations. Reserve a study room to see it here."
            />
          ) : (
            <ReservationSection
              title="History"
              reservations={past}
              loading={loading}
              onCancel={onCancel}
              onOpenRoom={openRoom}
              emptyMessage="Past and cancelled reservations will appear here."
            />
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.subtext} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[type.h1, styles.title]}>Your bookings</Text>
            <Text style={[type.small, styles.subtitle]}>
              Track upcoming reservations and revisit past sessions.
            </Text>
            {error ? <Text style={[type.small, styles.error]}>{error}</Text> : null}
          </View>
        }
      />
    </Screen>
  );
}

function ReservationSection({
  title,
  reservations,
  loading,
  onCancel,
  onOpenRoom,
  emptyMessage,
}: {
  title: string;
  reservations: Reservation[];
  loading: boolean;
  onCancel: (reservation: Reservation) => void;
  onOpenRoom: (roomId: string) => void;
  emptyMessage: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[type.h2, styles.sectionTitle]}>{title}</Text>
        <Text style={[type.small, styles.sectionCount]}>{reservations.length}</Text>
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <View style={{ height: spacing.sm }} />
          <Text style={[type.small, styles.loadingText]}>Loading…</Text>
        </View>
      ) : reservations.length === 0 ? (
        <Text style={[type.small, styles.emptyText]}>{emptyMessage}</Text>
      ) : (
        reservations.map((reservation) => (
          <View key={`${title}-${reservation.id}`} style={styles.reservationCard}>
            <View style={{ flex: 1, gap: spacing.xs / 2 }}>
              <Text style={[type.body, styles.reservationTitle]}>
                {reservation.roomName ?? "Study Room"}
              </Text>
              <Text style={[type.small, styles.reservationMeta]}>
                {reservation.building ?? "Campus room"}
              </Text>
              <Text style={[type.small, styles.reservationTiming]}>
                {formatReservation(reservation)}
              </Text>
              {reservation.purpose ? (
                <Text style={[type.small, styles.reservationPurpose]}>
                  Purpose: {reservation.purpose}
                </Text>
              ) : null}
              {reservation.status === "cancelled" ? (
                <Text style={[type.small, styles.cancelledBadge]}>Cancelled</Text>
              ) : null}
              {reservation.photoUrl ? (
                <Image source={{ uri: reservation.photoUrl }} style={styles.reservationPhoto} />
              ) : null}
            </View>
            <View style={styles.actionColumn}>
              <Button
                title="View room"
                variant="secondary"
                onPress={() => onOpenRoom(reservation.roomId)}
                style={styles.actionBtn}
              />
              {reservation.status === "confirmed" && reservation.end > new Date() ? (
                <Button
                  title="Cancel"
                  variant="danger"
                  onPress={() => onCancel(reservation)}
                  style={styles.actionBtn}
                />
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function formatReservation(reservation: Reservation) {
  const { start, end } = reservation;
  const sameDay = start.toDateString() === end.toDateString();
  const dayLabel = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startLabel = start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const endLabel = end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return sameDay ? `${dayLabel} · ${startLabel} - ${endLabel}` : `${dayLabel} · ${startLabel} → ${endLabel}`;
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xl * 2,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: { color: colors.text },
  subtitle: { color: colors.subtext },
  error: { color: colors.danger },
  section: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.text, flex: 1 },
  sectionCount: {
    backgroundColor: colors.inputBg,
    color: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  loading: {
    alignItems: "center",
  },
  loadingText: { color: colors.subtext },
  emptyText: { color: colors.subtext },
  emptyTitle: { color: colors.text, marginBottom: spacing.xs },
  centerMessage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    gap: spacing.sm,
  },
  reservationCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    flexDirection: "row",
    gap: spacing.md,
  },
  reservationTitle: { color: colors.text },
  reservationMeta: { color: colors.subtext },
  reservationTiming: { color: colors.subtext },
  reservationPurpose: { color: colors.subtext },
  cancelledBadge: { color: colors.danger, fontStyle: "italic" },
  actionColumn: {
    gap: spacing.sm,
    width: 120,
  },
  actionBtn: { paddingHorizontal: spacing.sm },
  reservationPhoto: {
    width: "100%",
    height: 140,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
});
