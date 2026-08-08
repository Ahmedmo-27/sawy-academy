"use client";

import Hls, { ErrorTypes, Events } from "hls.js";
import { useCallback, useEffect, useId, useRef, useState } from "react";

interface VideoPlayerProps {
  manifestUrl: string;
  title: string;
  watermarkText: string;
  onRefreshManifest: () => Promise<string>;
}

const WATERMARK_POSITIONS = [
  "left-[5%] top-[8%]",
  "right-[5%] top-[12%]",
  "left-[8%] top-[58%]",
  "right-[8%] top-[54%]",
] as const;

const MAX_REFRESH_ATTEMPTS = 2;
const MAX_HLS_RECOVERY_ATTEMPTS = 2;

function safeManifestUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const pageOrigin =
      typeof window === "undefined" ? "https://local.invalid" : window.location.origin;
    const url = new URL(value, pageOrigin);
    const sameOrigin = url.origin === pageOrigin;
    if (url.protocol !== "https:" && !(sameOrigin && url.protocol === "http:")) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function VideoPlayer({
  manifestUrl,
  title,
  watermarkText,
  onRefreshManifest,
}: VideoPlayerProps) {
  const headingId = useId();
  const playerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const refreshManifestRef = useRef(onRefreshManifest);
  const refreshingRef = useRef(false);
  const refreshAttemptsRef = useRef(0);
  const networkRecoveryRef = useRef(0);
  const mediaRecoveryRef = useRef(0);
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);
  const [sourceUrl, setSourceUrl] = useState(() =>
    safeManifestUrl(manifestUrl)
  );
  const [sourceVersion, setSourceVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState(0);

  useEffect(() => {
    refreshManifestRef.current = onRefreshManifest;
  }, [onRefreshManifest]);

  useEffect(() => {
    setSourceUrl(safeManifestUrl(manifestUrl));
    refreshAttemptsRef.current = 0;
    networkRecoveryRef.current = 0;
    mediaRecoveryRef.current = 0;
    setPlaybackError("");
  }, [manifestUrl]);

  useEffect(() => {
    const reducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      setWatermarkPosition((current) => {
        let next = Math.floor(Math.random() * WATERMARK_POSITIONS.length);
        if (next === current) {
          next = (current + 1) % WATERMARK_POSITIONS.length;
        }
        return next;
      });
    }, 45_000);

    return () => window.clearInterval(interval);
  }, []);

  const refreshManifest = useCallback(async () => {
    if (
      refreshingRef.current ||
      refreshAttemptsRef.current >= MAX_REFRESH_ATTEMPTS
    ) {
      if (refreshAttemptsRef.current >= MAX_REFRESH_ATTEMPTS) {
        setPlaybackError(
          "The recording could not be resumed. Reload the page to try again."
        );
      }
      return;
    }

    refreshingRef.current = true;
    refreshAttemptsRef.current += 1;
    setRefreshing(true);
    setPlaybackError("");

    const video = videoRef.current;
    resumeRef.current = {
      time: video?.currentTime ?? 0,
      playing: Boolean(video && !video.paused),
    };

    try {
      const freshUrl = safeManifestUrl(await refreshManifestRef.current());
      if (!freshUrl) throw new Error("Invalid refreshed video URL");
      setSourceUrl(freshUrl);
      setSourceVersion((version) => version + 1);
    } catch {
      setPlaybackError(
        "Your playback link could not be refreshed. Check your connection and try again."
      );
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sourceUrl) return;

    let disposed = false;
    const restorePlayback = () => {
      const resume = resumeRef.current;
      if (!resume || disposed) return;
      resumeRef.current = null;
      if (resume.time > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(resume.time, video.duration);
      }
      if (resume.playing) void video.play().catch(() => {});
    };
    const handleCanPlay = () => {
      networkRecoveryRef.current = 0;
      mediaRecoveryRef.current = 0;
      setPlaybackError("");
      restorePlayback();
    };

    video.addEventListener("canplay", handleCanPlay);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        xhrSetup(xhr, url) {
          const requestUrl = new URL(url, window.location.href);
          xhr.withCredentials = requestUrl.origin === window.location.origin;
        },
      });
      hlsRef.current = hls;
      hls.on(Events.MEDIA_ATTACHED, () => hls.loadSource(sourceUrl));
      hls.on(Events.MANIFEST_PARSED, restorePlayback);
      hls.on(Events.ERROR, (_event, data) => {
        if (!data.fatal || disposed) return;

        if (
          data.type === ErrorTypes.NETWORK_ERROR &&
          networkRecoveryRef.current < MAX_HLS_RECOVERY_ATTEMPTS
        ) {
          networkRecoveryRef.current += 1;
          if (networkRecoveryRef.current === 1) {
            hls.startLoad();
          } else {
            void refreshManifest();
          }
          return;
        }

        if (
          data.type === ErrorTypes.MEDIA_ERROR &&
          mediaRecoveryRef.current < MAX_HLS_RECOVERY_ATTEMPTS
        ) {
          mediaRecoveryRef.current += 1;
          if (mediaRecoveryRef.current === 1) {
            hls.recoverMediaError();
          } else {
            void refreshManifest();
          }
          return;
        }

        setPlaybackError(
          "The recording could not be played. Reload the page to try again."
        );
      });
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = sourceUrl;
      video.load();
    } else {
      setPlaybackError("This browser does not support protected HLS playback.");
    }

    return () => {
      disposed = true;
      video.removeEventListener("canplay", handleCanPlay);
      const hls = hlsRef.current;
      if (hls) {
        hls.destroy();
        if (hlsRef.current === hls) hlsRef.current = null;
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [refreshManifest, sourceUrl, sourceVersion]);

  if (!sourceUrl) {
    return (
      <div className="hairline-border p-6 type-infill" role="alert">
        This recording is temporarily unavailable.
      </div>
    );
  }

  return (
    <section aria-labelledby={headingId}>
      <p id={headingId} className="label-caps mb-3">
        Lesson recording
      </p>

      <div
        ref={playerRef}
        className="relative aspect-video w-full overflow-hidden bg-charcoal select-none"
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        onDoubleClick={(event) => {
          event.preventDefault();
          void playerRef.current?.requestFullscreen?.();
        }}
        role="group"
        aria-label={`${title} protected video player`}
      >
        <video
          ref={videoRef}
          controls
          controlsList="nodownload nofullscreen"
          preload="metadata"
          className="absolute inset-0 h-full w-full bg-charcoal"
          aria-label={`${title} video`}
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
          onError={() => {
            if (!Hls.isSupported()) void refreshManifest();
          }}
        >
          Your browser cannot play this video.
        </video>

        <button
          type="button"
          className="absolute right-3 top-3 z-30 bg-charcoal/70 px-3 py-2 label-caps !text-concrete"
          aria-label="Enter video fullscreen"
          onClick={() => void playerRef.current?.requestFullscreen?.()}
        >
          Fullscreen
        </button>

        <span
          className={`pointer-events-none absolute z-20 max-w-[70%] truncate font-sans text-xs text-concrete opacity-20 mix-blend-difference transition-[top,left,right] duration-1000 ${WATERMARK_POSITIONS[watermarkPosition]}`}
          aria-hidden="true"
        >
          {watermarkText}
        </span>

        {refreshing && (
          <div
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-charcoal/60"
            role="status"
            aria-live="polite"
          >
            <span className="label-caps !text-concrete">Refreshing playback…</span>
          </div>
        )}
      </div>
      {playbackError && (
        <p className="type-infill mt-3 text-clay" role="alert">
          {playbackError}
        </p>
      )}
    </section>
  );
}
