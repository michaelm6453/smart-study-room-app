// Helpers for generating map previews and deep links.
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra || {}) as Record<string, string | undefined>;
const staticKey = extra.GOOGLE_MAPS_STATIC_KEY;

export function getStaticMapUrl(lat: number, lng: number, label?: string) {
  if (!staticKey) {
    return null;
  }

  const markerLabel = (label?.trim()[0] || "R").toUpperCase();
  const coords = `${lat},${lng}`;
  const params = new URLSearchParams({
    key: staticKey,
    size: "600x300",
    scale: "2",
    zoom: "17",
    maptype: "roadmap",
    markers: `color:0x0054A4|label:${markerLabel}|${coords}`,
  }).toString();

  // URLSearchParams encodes "|" as %7C; revert so Maps API accepts it.
  return `https://maps.googleapis.com/maps/api/staticmap?${params.replace(/%7C/g, "|")}`;
}

export function getGoogleMapsDirectionsUrl(lat: number, lng: number) {
  const coords = `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coords)}`;
}

export function getEmbeddedMapHtml(lat: number, lng: number, _label?: string) {
  if (!staticKey) {
    return null;
  }

  const coords = `${lat},${lng}`;
  const src = `https://www.google.com/maps/embed/v1/place?key=${staticKey}&q=${encodeURIComponent(
    coords,
  )}&zoom=18&maptype=roadmap`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1, maximum-scale=1">
        <style>body,html{margin:0;padding:0;height:100%;}</style>
      </head>
      <body>
        <iframe
          src="${src}"
          width="100%"
          height="100%"
          frameborder="0"
          style="border:0;"
          allowfullscreen
        ></iframe>
      </body>
    </html>
  `;
}
