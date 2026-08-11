const dotenv = require("dotenv");
const fs = require("fs");
const mongoose = require("mongoose");
const { runWorker } = require("../workers/videoProcessingWorker");
const { getVideoKeyKek } = require("../lib/videoEncryption");
const { getVideoProcessingConfig } = require("../lib/videoProcessingConfig");
const logger = require("../utils/logger");

dotenv.config();

function assertBinaryExists(label, binaryPath) {
  if (pathLooksAbsolute(binaryPath) && !fs.existsSync(binaryPath)) {
    throw new Error(
      `${label} not found at ${binaryPath}. Install FFmpeg or set ${label}.`
    );
  }
}

function pathLooksAbsolute(value) {
  return /[\\/]/.test(value);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to start the video worker");
  }
  getVideoKeyKek();
  const tools = getVideoProcessingConfig();
  assertBinaryExists("FFMPEG_PATH", tools.ffmpegPath);
  assertBinaryExists("FFPROBE_PATH", tools.ffprobePath);
  logger.info("Video worker binaries", {
    ffmpegPath: tools.ffmpegPath,
    ffprobePath: tools.ffprobePath,
  });
  await mongoose.connect(process.env.MONGODB_URI);

  const abortController = new AbortController();
  const stop = () => abortController.abort();
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);

  try {
    await runWorker({ signal: abortController.signal });
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  logger.error("Video processing worker crashed", { error });
  process.exitCode = 1;
});
