const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const PROFILES = [
  {
    name: "1080p",
    width: 1920,
    height: 1080,
    videoBitrate: "5000k",
    bandwidth: 5_500_000,
  },
  {
    name: "720p",
    width: 1280,
    height: 720,
    videoBitrate: "2800k",
    bandwidth: 3_200_000,
  },
  {
    name: "480p",
    width: 854,
    height: 480,
    videoBitrate: "1400k",
    bandwidth: 1_800_000,
  },
];

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });
    let output = "";
    const append = (chunk) => {
      output = `${output}${chunk}`.slice(-32_000);
    };
    child.stdout.on("data", append);
    child.stderr.on("data", append);
    child.once("error", (error) => {
      if (error.code === "ENOENT") {
        const missing = new Error(
          `${path.basename(command)} was not found. Install FFmpeg and set FFMPEG_PATH / FFPROBE_PATH, or place binaries in tools/ffmpeg/bin.`
        );
        missing.code = "FFMPEG_NOT_FOUND";
        reject(missing);
        return;
      }
      reject(error);
    });
    child.once("close", (code, signal) => {
      if (code === 0) {
        resolve(output);
        return;
      }
      const error = new Error(
        `${path.basename(command)} failed (${signal || code}): ${output.trim()}`
      );
      error.code = "TRANSCODER_FAILED";
      reject(error);
    });
  });
}

async function probeVideo(inputPath, ffprobePath = "ffprobe") {
  const output = await runProcess(ffprobePath, [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=index,codec_type,codec_name,width,height",
    "-of",
    "json",
    inputPath,
  ]);
  let probe;
  try {
    probe = JSON.parse(output);
  } catch {
    const error = new Error("ffprobe returned invalid JSON");
    error.code = "INVALID_MEDIA";
    throw error;
  }

  const video = probe.streams?.find((stream) => stream.codec_type === "video");
  const audio = probe.streams?.find((stream) => stream.codec_type === "audio");
  const durationSeconds = Number(probe.format?.duration);
  if (
    !video ||
    !Number.isFinite(durationSeconds) ||
    durationSeconds <= 0 ||
    !Number.isInteger(video.width) ||
    !Number.isInteger(video.height) ||
    video.width < 2 ||
    video.height < 2
  ) {
    const error = new Error("Uploaded file is not a valid, non-empty video");
    error.code = "INVALID_MEDIA";
    throw error;
  }

  return {
    durationSeconds,
    sourceWidth: video.width,
    sourceHeight: video.height,
    videoCodec: video.codec_name,
    audioCodec: audio?.codec_name,
  };
}

function even(value) {
  return Math.max(2, Math.floor(value / 2) * 2);
}

function selectRenditions(sourceWidth, sourceHeight) {
  const selected = PROFILES.filter((profile) => profile.height <= sourceHeight);
  if (selected.length === 0) {
    const height = even(sourceHeight);
    const bandwidth = Math.max(
      500_000,
      Math.round(1_800_000 * (height / 480) ** 2)
    );
    selected.push({
      name: `${height}p`,
      width: even(sourceWidth),
      height,
      videoBitrate: `${Math.round(bandwidth * 0.8 / 1000)}k`,
      bandwidth,
    });
  }

  return selected.map((profile) => ({
    ...profile,
    width: Math.min(
      profile.width,
      even((sourceWidth / sourceHeight) * profile.height)
    ),
  }));
}

function writeMasterPlaylist(outputDirectory, renditions) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const rendition of renditions) {
    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${rendition.bandwidth},RESOLUTION=${rendition.width}x${rendition.height}`,
      `${rendition.name}/index.m3u8`
    );
  }
  return fs.promises.writeFile(
    path.join(outputDirectory, "master.m3u8"),
    `${lines.join("\n")}\n`
  );
}

function buildFfmpegArgs({
  inputPath,
  keyInfoPath,
  rendition,
  renditionDirectory,
  startNumber,
}) {
  return [
    "-hide_banner",
    "-nostdin",
    "-y",
    "-i",
    inputPath,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-vf",
    `scale=${rendition.width}:${rendition.height}:force_original_aspect_ratio=decrease:force_divisible_by=2`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-profile:v",
    "high",
    "-pix_fmt",
    "yuv420p",
    "-b:v",
    rendition.videoBitrate,
    "-maxrate",
    rendition.videoBitrate,
    "-bufsize",
    `${Math.round(Number.parseInt(rendition.videoBitrate, 10) * 2)}k`,
    "-force_key_frames",
    "expr:gte(t,n_forced*6)",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-ac",
    "2",
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_playlist_type",
    "vod",
    "-start_number",
    String(startNumber),
    "-hls_flags",
    "independent_segments",
    "-hls_key_info_file",
    keyInfoPath,
    "-hls_segment_filename",
    path.join(renditionDirectory, "segment-%06d.ts"),
    path.join(renditionDirectory, "index.m3u8"),
  ];
}

async function transcodeToEncryptedHls({
  contentKey,
  ffmpegPath = "ffmpeg",
  inputPath,
  keyUri,
  outputDirectory,
  sourceWidth,
  sourceHeight,
}) {
  const keyPath = path.join(path.dirname(outputDirectory), "content.key");
  const keyInfoPath = path.join(path.dirname(outputDirectory), "key-info.txt");
  await fs.promises.mkdir(outputDirectory, { recursive: true });
  await fs.promises.writeFile(keyPath, contentKey, { mode: 0o600 });
  await fs.promises.writeFile(keyInfoPath, `${keyUri}\n${keyPath}\n`, {
    mode: 0o600,
  });

  try {
    const renditions = selectRenditions(sourceWidth, sourceHeight);
    for (const rendition of renditions) {
      const renditionDirectory = path.join(outputDirectory, rendition.name);
      const startNumber = crypto.randomInt(1, 2 ** 31);
      await fs.promises.mkdir(renditionDirectory, { recursive: true });
      await runProcess(
        ffmpegPath,
        buildFfmpegArgs({
          inputPath,
          keyInfoPath,
          rendition,
          renditionDirectory,
          startNumber,
        })
      );
    }

    await writeMasterPlaylist(outputDirectory, renditions);
    return renditions;
  } finally {
    await Promise.all([
      fs.promises.rm(keyPath, { force: true }),
      fs.promises.rm(keyInfoPath, { force: true }),
    ]);
  }
}

module.exports = {
  buildFfmpegArgs,
  probeVideo,
  runProcess,
  selectRenditions,
  transcodeToEncryptedHls,
};
