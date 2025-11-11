// Quick Ontario Tech seed data for demos / testing.
import { RoomInput } from "./store";

export type SampleRoom = RoomInput & { id: string };

export const ontarioTechRooms: SampleRoom[] = [
  {
    id: "science-110",
    name: "Science Building – Room 110",
    building: "Science Building",
    floor: "Level 1",
    capacity: 8,
    amenities: ["Whiteboard", "HD Display", "Power Outlets"],
    description: "Bright study room near the atrium with plenty of natural light.",
    openingHours: { start: "07:00", end: "23:00" },
    location: { lat: 43.94595, lng: -78.89642, label: "Science Building Entrance" },
  },
  {
    id: "engineering-201",
    name: "Engineering Building – Collaboration Lab 201",
    building: "Engineering Building",
    floor: "Level 2",
    capacity: 10,
    amenities: ["Conference Table", "Video Conferencing", "HDMI"],
    description: "Perfect for capstone project meetings with remote teammates.",
    openingHours: { start: "08:00", end: "22:00" },
    location: { lat: 43.94663, lng: -78.89774, label: "Eng Building South Entrance" },
  },
  {
    id: "library-quiet-3a",
    name: "Campus Library – Quiet Pod 3A",
    building: "Campus Library",
    floor: "Level 3",
    capacity: 4,
    amenities: ["Sound Dampening", "Task Lighting"],
    description: "Silent pod intended for focused study or exam prep.",
    openingHours: { start: "09:00", end: "21:00" },
    location: { lat: 43.945945553248, lng: -78.89757836074783, label: "Library Main Entrance" },
  },
];
