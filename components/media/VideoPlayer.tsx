"use client";

import Hls, { ErrorTypes, Events } from "hls.js";
import { useCallback, useEffect, useId, useRef, useState } from "react";

interface VideoPlayerProps {
  manifestUrl: string;
  title: string;
  watermarkText: string;
  onRefreshManifest: () => Promise<string>;
}

interface QualityOption {
  id: number;
  label: string;
  detail: string;
}

const WATERMARK_POSITIONS = [
  "left-[5%] top-[8%]",
  "right-[5%] top-[12%]",
  "left-[8%] top-[58%]",
  "right-[8%] top-[54%]",
] as const;

const MAX_REFRESH_ATTEMPTS = 2;
const MAX_HLS_RECOVERY_ATTEMPTS = 2;
const AUTO_LEVEL = -1;

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

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  const padded = `${minutes}:${String(rest).padStart(2, "0")}`;
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}` : padded;
}

function formatBandwidth(bitsPerSecond: number) {
  if (!Number.isFinite(bitsPerSecond) || bitsPerSecond <= 0) return "";
  const mbps = bitsPerSecond / 1_000_000;
  if (mbps >= 1) return `${mbps.toFixed(mbps >= 10 ? 0 : 1)} Mbps`;
  return `${Math.round(bitsPerSecond / 1000)} kbps`;
}

function labelForLevel(level: { height?: number; width?: number; bitrate?: number }) {
  const height = Number(level.height) || 0;
  const label = height >= 180 ? `${height}p` : level.width ? `${level.width}w` : "Source";
  return { label, detail: formatBandwidth(Number(level.bitrate) || 0) };
}

function optionsFromHls(hls: Hls): QualityOption[] {
  return hls.levels.map((level, index) => {
    const { label, detail } = labelForLevel(level);
    return { id: index, label, detail };
  });
}

export function VideoPlayer({
  manifestUrl,
  title,
  watermarkText,
  onRefreshManifest,
}: VideoPlayerProps) {
  const headingId = useId();
  const qualityMenuId = useId();
  const playerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const refreshManifestRef = useRef(onRefreshManifest);
  const refreshingRef = useRef(false);
  const refreshAttemptsRef = useRef(0);
  const networkRecoveryRef = useRef(0);
  const mediaRecoveryRef = useRef(0);
  const hideControlsRef = useRef<number | null>(null);
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);
  const [sourceUrl, setSourceUrl] = useState(() =>
    safeManifestUrl(manifestUrl)
  );
  const [sourceVersion, setSourceVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [watermarkPosition, setWatermarkPosition] = useState(0);
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [qualities, setQualities] = useState<QualityOption[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(AUTO_LEVEL);
  const [activeLevel, setActiveLevel] = useState(AUTO_LEVEL);
  const [qualityOpen, setQualityOpen] = useState(false);

  useEffect(() => {
    refreshManifestRef.current = onRefreshManifest;
  }, [onRefreshManifest]);

  useEffect(() => {
    setSourceUrl(safeManifestUrl(manifestUrl));
    refreshAttemptsRef.current = 0;
    networkRecoveryRef.current = 0;
    mediaRecoveryRef.current = 0;
    setPlaybackError("");
    setQualities([]);
    setSelectedLevel(AUTO_LEVEL);
    setActiveLevel(AUTO_LEVEL);
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

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsRef.current) window.clearTimeout(hideControlsRef.current);
    hideControlsRef.current = window.setTimeout(() => {
      if (!videoRef.current?.paused) setControlsVisible(false);
      setQualityOpen(false);
    }, 2800);
  }, []);

  useEffect(() => {
    return () => {
      if (hideControlsRef.current) window.clearTimeout(hideControlsRef.current);
    };
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === playerRef.current);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
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
    const syncVideoState = () => {
      setPaused(video.paused);
      setMuted(video.muted);
      setVolume(video.volume);
      setCurrentTime(video.currentTime);
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    };
    const handleCanPlay = () => {
      networkRecoveryRef.current = 0;
      mediaRecoveryRef.current = 0;
      setPlaybackError("");
      restorePlayback();
      syncVideoState();
    };
    const syncLevels = (hls: Hls) => {
      setQualities(optionsFromHls(hls));
      setSelectedLevel(hls.autoLevelEnabled ? AUTO_LEVEL : hls.currentLevel);
      setActiveLevel(hls.currentLevel);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", syncVideoState);
    video.addEventListener("pause", syncVideoState);
    video.addEventListener("timeupdate", syncVideoState);
    video.addEventListener("durationchange", syncVideoState);
    video.addEventListener("volumechange", syncVideoState);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        capLevelToPlayerSize: true,
        xhrSetup(xhr, url) {
          const requestUrl = new URL(url, window.location.href);
          xhr.withCredentials = requestUrl.origin === window.location.origin;
        },
      });
      hlsRef.current = hls;
      hls.on(Events.MEDIA_ATTACHED, () => hls.loadSource(sourceUrl));
      hls.on(Events.MANIFEST_PARSED, () => {
        syncLevels(hls);
        restorePlayback();
      });
      hls.on(Events.LEVELS_UPDATED, () => syncLevels(hls));
      hls.on(Events.LEVEL_SWITCHED, (_event, data) => {
        setActiveLevel(data.level);
      });
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
      video.removeEventListener("play", syncVideoState);
      video.removeEventListener("pause", syncVideoState);
      video.removeEventListener("timeupdate", syncVideoState);
      video.removeEventListener("durationchange", syncVideoState);
      video.removeEventListener("volumechange", syncVideoState);
      const hls = hlsRef.current;
      if (hls) {
        hls.destroy();
        if (hlsRef.current === hls) hlsRef.current = null;
      }
      video.removeAttribute("src");
      video.load();
    };
  }, [refreshManifest, sourceUrl, sourceVersion]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
    revealControls();
  }

  function seekTo(value: number) {
    const video = videoRef.current;
    if (!video || !Number.isFinite(value)) return;
    video.currentTime = Math.min(Math.max(0, value), duration || value);
    setCurrentTime(video.currentTime);
  }

  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  function changeVolume(value: number) {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = value === 0;
    setVolume(video.volume);
    setMuted(video.muted);
  }

  function toggleFullscreen() {
    if (document.fullscreenElement === playerRef.current) {
      void document.exitFullscreen?.();
      return;
    }
    void playerRef.current?.requestFullscreen?.();
  }

  function selectQuality(level: number) {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = level;
    setSelectedLevel(level);
    setQualityOpen(false);
    revealControls();
  }

  const activeQuality =
    activeLevel >= 0 ? qualities.find((option) => option.id === activeLevel) : null;
  const qualityButtonLabel =
    selectedLevel === AUTO_LEVEL
      ? activeQuality
        ? `Auto · ${activeQuality.label}`
        : "Auto"
      : qualities.find((option) => option.id === selectedLevel)?.label ?? "Quality";

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
        className="group/player relative aspect-video w-full overflow-hidden bg-charcoal select-none ring-1 ring-hairline/40"
        draggable={false}
        onContextMenu={(event) => event.preventDefault()}
        onDragStart={(event) => event.preventDefault()}
        onMouseMove={revealControls}
        onFocusCapture={revealControls}
        onDoubleClick={(event) => {
          event.preventDefault();
          toggleFullscreen();
        }}
        role="group"
        aria-label={`${title} protected video player`}
      >
        <video
          ref={videoRef}
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full bg-charcoal"
          aria-label={`${title} video`}
          draggable={false}
          onClick={togglePlay}
          onContextMenu={(event) => event.preventDefault()}
          onDragStart={(event) => event.preventDefault()}
          onError={() => {
            if (!Hls.isSupported()) void refreshManifest();
          }}
        >
          Your browser cannot play this video.
        </video>

        <span
          className={`pointer-events-none absolute z-20 max-w-[70%] truncate font-sans text-xs text-concrete opacity-20 mix-blend-difference transition-[top,left,right] duration-1000 ${WATERMARK_POSITIONS[watermarkPosition]}`}
          aria-hidden="true"
        >
          {watermarkText}
        </span>

        {paused && !refreshing && (
          <button
            type="button"
            className="absolute left-1/2 top-1/2 z-30 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-concrete/95 text-charcoal shadow-lg transition hover:bg-concrete"
            aria-label={`Play ${title}`}
            onClick={togglePlay}
          >
            <span className="ml-1 border-y-[10px] border-l-[16px] border-y-transparent border-l-charcoal" />
          </button>
        )}

        <div
          className={`absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-charcoal via-charcoal/80 to-transparent px-3 pb-3 pt-10 transition-opacity duration-300 ${
            controlsVisible || paused || qualityOpen
              ? "opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          <label className="sr-only" htmlFor={`${headingId}-seek`}>
            Seek
          </label>
          <input
            id={`${headingId}-seek`}
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || currentTime)}
            disabled={!duration}
            onChange={(event) => seekTo(Number(event.target.value))}
            className="mb-2 h-1 w-full cursor-pointer appearance-none bg-concrete/20 accent-clay"
          />

          <div className="flex items-center gap-2 text-concrete">
            <button
              type="button"
              className="label-caps min-h-9 px-2 !text-concrete hover:text-clay-muted"
              aria-label={paused ? "Play" : "Pause"}
              onClick={togglePlay}
            >
              {paused ? "Play" : "Pause"}
            </button>

            <span className="label-caps tabular-nums !text-concrete/70">
              {formatTime(currentTime)}
              <span className="mx-1 opacity-40">/</span>
              {formatTime(duration)}
            </span>

            <button
              type="button"
              className="label-caps min-h-9 px-2 !text-concrete hover:text-clay-muted"
              aria-label={muted ? "Unmute" : "Mute"}
              onClick={toggleMute}
            >
              {muted || volume === 0 ? "Unmute" : "Mute"}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              aria-label="Volume"
              onChange={(event) => changeVolume(Number(event.target.value))}
              className="hidden h-1 w-20 cursor-pointer appearance-none bg-concrete/20 accent-clay sm:block"
            />

            <div className="relative ml-auto">
              {qualities.length > 0 && (
                <>
                  <button
                    type="button"
                    className="label-caps min-h-9 px-2 !text-concrete hover:text-clay-muted"
                    aria-haspopup="listbox"
                    aria-expanded={qualityOpen}
                    aria-controls={qualityMenuId}
                    onClick={() => {
                      setQualityOpen((open) => !open);
                      revealControls();
                    }}
                  >
                    {qualityButtonLabel}
                  </button>
                  {qualityOpen && (
                    <ul
                      id={qualityMenuId}
                      role="listbox"
                      aria-label="Video resolution"
                      className="absolute bottom-full right-0 z-40 mb-2 min-w-40 border border-hairline/30 bg-charcoal/95 py-1 shadow-xl"
                    >
                      <li>
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedLevel === AUTO_LEVEL}
                          className={`flex w-full items-baseline justify-between gap-4 px-3 py-2 text-left label-caps !text-concrete hover:bg-concrete/10 ${
                            selectedLevel === AUTO_LEVEL ? "text-clay-muted" : ""
                          }`}
                          onClick={() => selectQuality(AUTO_LEVEL)}
                        >
                          <span>Auto</span>
                          {selectedLevel === AUTO_LEVEL && activeQuality && (
                            <span className="opacity-50">{activeQuality.label}</span>
                          )}
                        </button>
                      </li>
                      {[...qualities].reverse().map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={selectedLevel === option.id}
                            className={`flex w-full items-baseline justify-between gap-4 px-3 py-2 text-left label-caps !text-concrete hover:bg-concrete/10 ${
                              selectedLevel === option.id ? "bg-concrete/10" : ""
                            }`}
                            onClick={() => selectQuality(option.id)}
                          >
                            <span>{option.label}</span>
                            {option.detail && (
                              <span className="opacity-50">{option.detail}</span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              className="label-caps min-h-9 px-2 !text-concrete hover:text-clay-muted"
              aria-label={isFullscreen ? "Exit video fullscreen" : "Enter video fullscreen"}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? "Exit" : "Full"}
            </button>
          </div>
        </div>

        {refreshing && (
          <div
            className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-charcoal/60"
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
