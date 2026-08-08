const os = require("os");

function positiveNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getVideoProcessingConfig() {
  const leaseMs = positiveNumber("VIDEO_WORKER_LEASE_MS", 5 * 60 * 1000);
  const heartbeatMs = positiveNumber(
    "VIDEO_WORKER_HEARTBEAT_MS",
    Math.min(60 * 1000, Math.floor(leaseMs / 3))
  );

  if (heartbeatMs >= leaseMs) {
    throw new Error("VIDEO_WORKER_HEARTBEAT_MS must be less than the lease");
  }

  return {
    ffmpegPath: String(process.env.FFMPEG_PATH || "ffmpeg").trim(),
    ffprobePath: String(process.env.FFPROBE_PATH || "ffprobe").trim(),
    heartbeatMs,
    idlePollMs: positiveNumber("VIDEO_WORKER_POLL_MS", 5_000),
    leaseMs,
    maxAttempts: Math.max(
      1,
      Math.floor(positiveNumber("VIDEO_WORKER_MAX_ATTEMPTS", 5))
    ),
    workerId: String(
      process.env.VIDEO_WORKER_ID ||
        `${os.hostname()}-${process.pid}-${Math.random().toString(36).slice(2, 8)}`
    ).trim(),
  };
}

module.exports = { getVideoProcessingConfig };
