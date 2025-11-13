import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import {
  AVPlaybackStatus,
  AVPlaybackStatusSuccess,
  ResizeMode,
  Video,
} from "expo-av";
import { WebView } from "react-native-webview";
import Button from "./Button";
import { colors, spacing, radius, type } from "../lib/theme";

type VideoHighlightProps = {
  title: string;
  description: string;
  source: { uri?: string; local?: any };
  style?: ViewStyle;
  ctaLabel?: string;
  onPressCta?: () => void;
};

export default function VideoHighlight({
  title,
  description,
  source,
  style,
  ctaLabel,
  onPressCta,
}: VideoHighlightProps) {
  const videoRef = useRef<Video | null>(null);
  const [status, setStatus] = useState<AVPlaybackStatusSuccess | null>(null);
  const embedUrl = source.uri ? getYouTubeEmbedUrl(source.uri) : null;

  function onStatusChange(nextStatus: AVPlaybackStatus) {
    if ("isLoaded" in nextStatus && nextStatus.isLoaded) {
      setStatus(nextStatus);
    }
  }

  return (
    <View style={[styles.card, style]}>
      <Text style={[type.h2, styles.title]}>{title}</Text>
      <Text style={[type.small, styles.subtitle]}>{description}</Text>
      {embedUrl ? (
        <WebView
          source={{ uri: embedUrl }}
          style={styles.player}
          allowsFullscreenVideo
          javaScriptEnabled
          allowsInlineMediaPlayback
        />
      ) : (
        <>
          <Video
            ref={videoRef}
            style={styles.player}
            source={source.local ? source.local : { uri: source.uri! }}
            useNativeControls
            resizeMode={ResizeMode.COVER}
            onPlaybackStatusUpdate={onStatusChange}
            shouldPlay={false}
          />
          {status ? (
            <Text style={[type.small, styles.progress]}>
              {Math.floor(status.positionMillis / 1000)}s /{" "}
              {Math.floor((status.durationMillis ?? 0) / 1000)}s
            </Text>
          ) : null}
        </>
      )}
      {ctaLabel ? (
        <Button
          title={ctaLabel}
          variant="secondary"
          onPress={onPressCta}
          style={styles.cta}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { color: colors.text },
  subtitle: { color: colors.subtext },
  player: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.inputBg,
  },
  progress: { color: colors.subtext },
  cta: { marginTop: spacing.sm },
});

function getYouTubeEmbedUrl(uri: string) {
  try {
    const url = new URL(uri);
    const host = url.hostname.toLowerCase();
    if (host.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.pathname.startsWith("/shorts/")) {
      const id = url.pathname.split("/").filter(Boolean)[1];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (url.searchParams.has("v")) {
      return `https://www.youtube.com/embed/${url.searchParams.get("v")}`;
    }
    if (url.pathname.startsWith("/embed/")) {
      return `https://www.youtube.com${url.pathname}`;
    }
  } catch {
    return null;
  }
  return null;
}
