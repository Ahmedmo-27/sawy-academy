const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { runWorker } = require("../workers/videoProcessingWorker");
const { getVideoKeyKek } = require("../lib/videoEncryption");
const logger = require("../utils/logger");

dotenv.config();

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required to start the video worker");
  }
  getVideoKeyKek();
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
