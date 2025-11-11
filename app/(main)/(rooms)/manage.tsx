// Admin UI for managing room documents (create/update/delete).
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import Screen from "../../../components/Screen";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import { colors, spacing, radius, type } from "../../../lib/theme";
import {
  Room,
  RoomInput,
  createRoom,
  deleteRoom,
  observeRooms,
  updateRoom,
} from "../../../lib/store";
import { ontarioTechRooms } from "../../../lib/sampleRooms";

type FormState = {
  id?: string;
  name: string;
  building: string;
  floor: string;
  capacity: string;
  amenities: string;
  description: string;
  openingStart: string;
  openingEnd: string;
  imageUrl: string;
  locationLabel: string;
  locationLat: string;
  locationLng: string;
};

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  building: "",
  floor: "",
  capacity: "",
  amenities: "",
  description: "",
  openingStart: "",
  openingEnd: "",
  imageUrl: "",
  locationLabel: "",
  locationLat: "",
  locationLng: "",
};

export default function ManageRoomsScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = observeRooms(
      (nextRooms) => {
        setRooms(nextRooms);
        setLoading(false);
      },
      (err) => {
        console.error("Room manage observer error", err);
        setError("Realtime updates unavailable. Reload to try again.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedId) ?? null,
    [rooms, selectedId],
  );

  useEffect(() => {
    if (!selectedRoom) {
      setForm(EMPTY_FORM);
      return;
    }

    // Populate the form with the selected room so edits feel instant.
    setForm({
      id: selectedRoom.id,
      name: selectedRoom.name,
      building: selectedRoom.building,
      floor: selectedRoom.floor ?? "",
      capacity: selectedRoom.capacity ? String(selectedRoom.capacity) : "",
      amenities: selectedRoom.amenities.join(", "),
      description: selectedRoom.description ?? "",
      openingStart: selectedRoom.openingHours?.start ?? "",
      openingEnd: selectedRoom.openingHours?.end ?? "",
      imageUrl: selectedRoom.imageUrl ?? "",
      locationLabel: selectedRoom.location?.label ?? "",
      locationLat: selectedRoom.location ? String(selectedRoom.location.lat) : "",
      locationLng: selectedRoom.location ? String(selectedRoom.location.lng) : "",
    });
  }, [selectedRoom]);

  function handleEdit(roomId: string) {
    setSelectedId(roomId);
    setSuccess(null);
    setError(null);
  }

  function handleCreateNew() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setSuccess(null);
    setError(null);
  }

  function handleFieldChange<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildRoomInput(): RoomInput {
    const capacityNumber = form.capacity.trim().length ? Number(form.capacity) : undefined;
    const amenitiesList = form.amenities
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const openingStart = form.openingStart.trim();
    const openingEnd = form.openingEnd.trim();
    const lat = form.locationLat.trim();
    const lng = form.locationLng.trim();
    const latNumber = lat.length ? Number(lat) : undefined;
    const lngNumber = lng.length ? Number(lng) : undefined;
    const hasCoords =
      latNumber !== undefined &&
      lngNumber !== undefined &&
      Number.isFinite(latNumber) &&
      Number.isFinite(lngNumber);
    const location = hasCoords
      ? {
          lat: latNumber!,
          lng: lngNumber!,
          label: form.locationLabel.trim() || undefined,
        }
      : undefined;

    return {
      name: form.name.trim(),
      building: form.building.trim(),
      floor: form.floor.trim() || undefined,
      capacity: Number.isNaN(capacityNumber) ? 0 : capacityNumber,
      amenities: amenitiesList,
      description: form.description.trim() || undefined,
      openingHours:
        openingStart && openingEnd
          ? {
              start: openingStart,
              end: openingEnd,
            }
          : undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      location,
    };
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const payload = buildRoomInput();

      if (selectedId) {
        // Edits go straight to Firestore doc.
        await updateRoom(selectedId, payload);
        setSuccess("Room updated.");
      } else {
        const customId = form.id?.trim() || undefined;
        // Allow admins to pin a doc ID for easier seeding/queries.
        const newId = await createRoom(payload, { id: customId });
        setSuccess(`Room created (${newId}).`);
        setSelectedId(newId);
      }
    } catch (err: any) {
      console.error("Save room failed", err);
      setError(err?.message ?? "Unable to save room. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) {
      return;
    }

    // Confirm deletion because this will clear reservations beneath the room.
    Alert.alert("Delete room?", "This removes the room and any upcoming reservations.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setDeleting(true);
            setError(null);
            setSuccess(null);
            await deleteRoom(selectedId);
            setSuccess("Room deleted.");
            handleCreateNew();
          } catch (err: any) {
            console.error("Delete room failed", err);
            setError(err?.message ?? "Unable to delete room.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  async function handleSeedSampleRooms() {
    Alert.alert("Seed Ontario Tech rooms?", "This will create a few demo rooms with coordinates.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Seed",
        onPress: async () => {
          try {
            setSeeding(true);
            setError(null);
            setSuccess(null);
            for (const sample of ontarioTechRooms) {
              await createRoom(sample, { id: sample.id });
            }
            setSuccess("Ontario Tech sample rooms added.");
          } catch (err: any) {
            console.error("Seed rooms failed", err);
            setError(err?.message ?? "Unable to seed sample rooms.");
          } finally {
            setSeeding(false);
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[type.h1, styles.title]}>Manage Rooms</Text>
          <Text style={[type.small, styles.subtitle]}>
            Add, edit, or delete study rooms. Restrict access to admins before production.
          </Text>
        </View>

        <View style={styles.toolbar}>
          <Button title="Create new room" onPress={handleCreateNew} variant="secondary" />
          <Button
            title={seeding ? "Seeding..." : "Seed Ontario Tech rooms"}
            onPress={handleSeedSampleRooms}
            variant="secondary"
            disabled={seeding}
            style={styles.seedBtn}
          />
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <View style={{ height: spacing.sm }} />
            <Text style={[type.small, styles.loadingText]}>Loading rooms…</Text>
          </View>
        ) : (
          <View style={styles.roomList}>
            {rooms.length === 0 ? (
              <Text style={[type.small, styles.empty]}>No rooms yet. Create your first one below.</Text>
            ) : (
              rooms.map((room) => (
                <Button
                  key={room.id}
                  title={room.name}
                  variant={room.id === selectedId ? "primary" : "secondary"}
                  onPress={() => handleEdit(room.id)}
                  style={styles.roomButton}
                />
              ))
            )}
          </View>
        )}

        <View style={styles.formCard}>
          <Text style={[type.h2, styles.formTitle]}>{selectedId ? "Edit room" : "Create a new room"}</Text>
          {error ? <Text style={[type.small, styles.error]}>{error}</Text> : null}
          {success ? <Text style={[type.small, styles.success]}>{success}</Text> : null}

          {!selectedId ? (
            <>
              <Text style={[type.small, styles.label]}>Custom ID (optional)</Text>
              <Input
                placeholder="engr-201"
                value={form.id}
                onChangeText={(value) => handleFieldChange("id", value)}
                autoCapitalize="none"
              />
              <View style={{ height: spacing.md }} />
            </>
          ) : (
            <Text style={[type.small, styles.meta]}>Room ID: {selectedId}</Text>
          )}

          <Text style={[type.small, styles.label]}>Name *</Text>
          <Input
            placeholder="Engineering Library – Room 201"
            value={form.name}
            onChangeText={(value) => handleFieldChange("name", value)}
          />

          <View style={{ height: spacing.md }} />
          <Text style={[type.small, styles.label]}>Building *</Text>
          <Input
            placeholder="Engineering Library"
            value={form.building}
            onChangeText={(value) => handleFieldChange("building", value)}
          />

          <View style={{ height: spacing.md }} />
          <Text style={[type.small, styles.label]}>Floor</Text>
          <Input placeholder="Level 2" value={form.floor} onChangeText={(value) => handleFieldChange("floor", value)} />

          <View style={{ height: spacing.md }} />
          <Text style={[type.small, styles.label]}>Capacity</Text>
          <Input
            placeholder="6"
            value={form.capacity}
            onChangeText={(value) => handleFieldChange("capacity", value.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
          />

          <View style={{ height: spacing.md }} />
          <Text style={[type.small, styles.label]}>Amenities (comma separated)</Text>
          <Input
            placeholder="Whiteboard, HDMI, Outlets"
            value={form.amenities}
            onChangeText={(value) => handleFieldChange("amenities", value)}
          />

          <View style={{ height: spacing.md }} />
          <Text style={[type.small, styles.label]}>Opening hours (HH:MM)</Text>
          <View style={styles.hoursRow}>
            <Input
              placeholder="07:00"
              value={form.openingStart}
              onChangeText={(value) => handleFieldChange("openingStart", value)}
              autoCapitalize="none"
              containerStyle={styles.hourInput}
            />
            <Text style={[type.small, styles.hoursSeparator]}>to</Text>
            <Input
              placeholder="23:00"
              value={form.openingEnd}
              onChangeText={(value) => handleFieldChange("openingEnd", value)}
              autoCapitalize="none"
              containerStyle={styles.hourInput}
            />
          </View>

          <View style={{ height: spacing.md }} />
          <Text style={[type.small, styles.label]}>Description</Text>
          <Input
            placeholder="Short description for students…"
            value={form.description}
            onChangeText={(value) => handleFieldChange("description", value)}
            multiline
            numberOfLines={3}
          />

          <View style={{ height: spacing.md }} />
          <Text style={[type.small, styles.label]}>Image URL</Text>
          <Input
            placeholder="https://example.com/room.jpg"
            value={form.imageUrl}
            onChangeText={(value) => handleFieldChange("imageUrl", value)}
            autoCapitalize="none"
          />

          <View style={{ height: spacing.md }} />
          <Text style={[type.small, styles.label]}>Campus location (for maps)</Text>
          <Input
            placeholder="Science Building Entrance"
            value={form.locationLabel}
            onChangeText={(value) => handleFieldChange("locationLabel", value)}
          />
          <View style={styles.hoursRow}>
            <Input
              placeholder="43.9459"
              keyboardType="decimal-pad"
              value={form.locationLat}
              onChangeText={(value) => handleFieldChange("locationLat", value)}
              autoCapitalize="none"
              containerStyle={styles.hourInput}
            />
            <Input
              placeholder="-78.8964"
              keyboardType="decimal-pad"
              value={form.locationLng}
              onChangeText={(value) => handleFieldChange("locationLng", value)}
              autoCapitalize="none"
              containerStyle={styles.hourInput}
            />
          </View>

          <View style={{ height: spacing.lg }} />
          <Button
            title={saving ? "Saving..." : selectedId ? "Save changes" : "Create room"}
            onPress={handleSave}
            disabled={saving}
          />

          {selectedId ? (
            <Button
              title={deleting ? "Deleting..." : "Delete room"}
              variant="danger"
              onPress={handleDelete}
              disabled={deleting}
              style={styles.deleteBtn}
            />
          ) : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    gap: spacing.xs,
  },
  title: { color: colors.text },
  subtitle: { color: colors.subtext },
  toolbar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  seedBtn: { minWidth: 190 },
  loading: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    backgroundColor: colors.card,
  },
  loadingText: { color: colors.subtext },
  roomList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  roomButton: {
    minWidth: "30%",
  },
  empty: { color: colors.subtext },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  formTitle: { color: colors.text },
  label: { color: colors.subtext },
  meta: { color: colors.subtext, marginBottom: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.sm },
  success: { color: colors.primary, marginBottom: spacing.sm },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  hoursSeparator: { color: colors.subtext },
  hourInput: { flex: 1 },
  deleteBtn: { marginTop: spacing.md },
});
