// Browse screen: lists Firestore rooms, adds search, and links to details.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { fetchRooms, observeRooms, Room } from "../../lib/store";
import Screen from "../../components/Screen";
import Button from "../../components/Button";
import Input from "../../components/Input";
import VideoHighlight from "../../components/VideoHighlight";
import { colors, spacing, radius, type } from "../../lib/theme";

const MAX_VISIBLE_AMENITIES = 3;
const heroImage = require("../../assets/ontariotechu-og-image.jpg");
const STUDY_TOUR_VIDEO = { uri: "https://youtu.be/Y_YLo5kfD-Y" };

function RoomCard({ room, onPress }: { room: Room; onPress: () => void }) {
  // Slice amenities so the card stays compact on smaller screens.
  const amenities = room.amenities.slice(0, MAX_VISIBLE_AMENITIES);
  const extraAmenities = room.amenities.length - amenities.length;
  const location = room.floor ? `${room.building} · ${room.floor}` : room.building;
  const capacityLabel = room.capacity > 0 ? `${room.capacity} seats` : "Flexible capacity";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.roomCard, pressed && styles.roomCardPressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={[type.h2, styles.roomName]}>{room.name}</Text>
        <Text style={[type.small, styles.capacity]}>{capacityLabel}</Text>
      </View>
      {room.location?.label ? (
        <Text style={[type.small, styles.locationLabel]}>{room.location.label}</Text>
      ) : null}
      <Text style={[type.small, styles.location]}>{location}</Text>
      {room.description ? (
        <Text style={[type.small, styles.description]} numberOfLines={2}>
          {room.description}
        </Text>
      ) : null}

      {amenities.length > 0 ? (
        <View style={styles.badgeRow}>
          {amenities.map((amenity) => (
            <View key={amenity} style={styles.badge}>
              <Text style={[type.small, styles.badgeText]}>{amenity}</Text>
            </View>
          ))}
          {extraAmenities > 0 ? (
            <View style={styles.badge}>
              <Text style={[type.small, styles.badgeText]}>+{extraAmenities} more</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {room.openingHours ? (
        <Text style={[type.small, styles.hours]}>
          Open {room.openingHours.start} - {room.openingHours.end}
        </Text>
      ) : null}

      <Text style={[type.small, styles.cardCta]}>View availability &gt;</Text>
    </Pressable>
  );
}

export default function Home() {
  // Keep a local reference of rooms and filter state.
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchRooms()
      .then((initialRooms) => {
        if (!mounted) return;
        // Populate the list immediately while the listener spins up.
        setRooms(initialRooms);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to fetch rooms", err);
        if (!mounted) return;
        setError("Unable to load rooms right now. Please try again.");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const unsubscribe = observeRooms(
      (nextRooms) => {
        if (!mounted) return;
        // Realtime listener keeps the list fresh.
        setRooms(nextRooms);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Room subscription error", err);
        if (!mounted) return;
        setError("Realtime updates are unavailable. Pull to refresh.");
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const latest = await fetchRooms();
      setRooms(latest);
      setError(null);
    } catch (err) {
      console.error("Failed to refresh rooms", err);
      setError("Failed to refresh rooms. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const openRoom = useCallback((roomId: string) => {
    router.push({
      pathname: "/(main)/(rooms)/[roomId]",
      params: { roomId },
    });
  }, []);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return rooms;
    }

    return rooms.filter((room) => {
      const haystack = [
        room.name,
        room.building,
        room.floor,
        room.amenities.join(" "), // Include amenities so searches like "whiteboard" work.
        room.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [rooms, search]);

  const showEmpty = !loading && rooms.length === 0;

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
          <View style={{ height: spacing.sm }} />
          <Text style={[type.small, styles.loadingText]}>Loading rooms…</Text>
        </View>
      </Screen>
    );
  }

  const listHeader = (
    <View style={styles.listHeader}>
      <Image source={heroImage} style={styles.hero} resizeMode="cover" />
      <View style={styles.pageTitle}>
        <Text style={[type.h1, styles.title]}>Reserve a study room</Text>
        <Text style={[type.small, styles.subtitle]}>
          Explore campus study spaces and find the right fit for your next session.
        </Text>
      </View>

      <VideoHighlight
        title="Smart Study Room tour"
        description="Watch best practices before you book your next session."
        source={STUDY_TOUR_VIDEO}
        style={styles.videoCard}
      />

      <Input
        placeholder="Search by name, building, or amenities"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        containerStyle={styles.search}
        returnKeyType="search"
      />

      <View style={styles.chipRow}>
        <Button
          title="Clear search"
          variant="secondary"
          onPress={() => setSearch("")}
          style={styles.clearBtn}
          disabled={!search}
        />
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={[type.body, styles.errorTitle]}>We hit a snag</Text>
          <Text style={[type.small, styles.errorText]}>{error}</Text>
          <Button
            title="Try again"
            variant="secondary"
            onPress={refresh}
            style={styles.retryButton}
          />
        </View>
      ) : null}
    </View>
  );

  const emptyComponent = showEmpty ? (
    <View style={styles.empty}>
      <Text style={[type.body, styles.emptyTitle]}>No rooms yet</Text>
      <Text style={[type.small, styles.emptyText]}>
        Add rooms via the admin manager (Profile tab) to get started.
      </Text>
      <Button title="Refresh" variant="secondary" onPress={refresh} style={styles.emptyButton} />
    </View>
  ) : search ? (
    <View style={styles.empty}>
      <Text style={[type.body, styles.emptyTitle]}>No rooms found</Text>
      <Text style={[type.small, styles.emptyText]}>
        Try adjusting your search keywords or clearing the filter.
      </Text>
    </View>
  ) : null;

  return (
    <Screen>
      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RoomCard room={item} onPress={() => openRoom(item.id)} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListHeaderComponentStyle={styles.listHeaderSpacing}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.subtext} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={emptyComponent}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    gap: spacing.xs,
  },
  title: { color: colors.text, marginBottom: spacing.xs / 2 },
  subtitle: { color: colors.subtext, marginTop: spacing.xs },
  search: {
    marginTop: spacing.lg,
  },
  chipRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  clearBtn: { paddingHorizontal: spacing.md },
  errorBox: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  errorTitle: { color: colors.text, marginBottom: spacing.xs },
  errorText: { color: colors.subtext },
  retryButton: { marginTop: spacing.sm },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: { color: colors.subtext },
  empty: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginTop: spacing.lg,
  },
  emptyTitle: { color: colors.text, marginBottom: spacing.xs },
  emptyText: { color: colors.subtext },
  emptyButton: { marginTop: spacing.md },
  listContent: {
    paddingBottom: spacing.xl * 1.5,
  },
  listHeader: {
    gap: spacing.md,
  },
  listHeaderSpacing: {
    paddingBottom: spacing.lg,
  },
  roomCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: "#102A43",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  roomCardPressed: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: spacing.xs,
  },
  roomName: { color: colors.text },
  capacity: { color: colors.subtext },
  location: { color: colors.subtext },
  locationLabel: { color: colors.accent, marginTop: spacing.xs / 2 },
  description: { color: colors.subtext, marginTop: spacing.xs },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
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
  hours: { color: colors.subtext, marginTop: spacing.md },
  cardCta: { color: colors.primary, marginTop: spacing.md },
  hero: {
    width: "100%",
    height: 160,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  videoCard: {
    marginTop: spacing.sm,
  },
});
