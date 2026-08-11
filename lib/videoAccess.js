const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  getPrivateR2Config,
  getR2Client,
  getR2Config,
} = require("./r2Config");
const { safeFilename, safeKeySegment } = require("./r2ObjectKeys");

const VIDEO_URL_EXPIRY_SECONDS = 4 * 60 * 60;

function safeVideoFilename(filename) {
  return safeFilename(filename, "lesson-video", ".mp4");
}

function buildVideoObjectKey(courseId, lessonId, filename) {
  const uniqueName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${safeVideoFilename(filename)}`;
  return [
    "videos",
    safeKeySegment(courseId, "course"),
    safeKeySegment(lessonId, "lesson"),
    uniqueName,
  ].join("/");
}

function buildVideoAssetSourceKey(courseId, lessonId, assetId, filename) {
  return [
    "video-assets",
    safeKeySegment(courseId, "course"),
    safeKeySegment(lessonId, "lesson"),
    safeKeySegment(assetId, "asset"),
    "source",
    safeVideoFilename(filename),
  ].join("/");
}

function buildVideoAssetOutputPrefix(courseId, lessonId, assetId) {
  return [
    "video-assets",
    safeKeySegment(courseId, "course"),
    safeKeySegment(lessonId, "lesson"),
    safeKeySegment(assetId, "asset"),
    "hls",
    "",
  ].join("/");
}

async function generateVideoSignedUrl(objectKey) {
  if (
    !objectKey ||
    !String(objectKey).startsWith("videos/") ||
    String(objectKey).includes("..")
  ) {
    throw new Error("Invalid lesson video object key");
  }

  const config = getPrivateR2Config();
  const expiresAt = new Date(
    Date.now() + VIDEO_URL_EXPIRY_SECONDS * 1000
  ).toISOString();
  const url = await getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: String(objectKey),
      ResponseContentDisposition: "inline",
    }),
    { expiresIn: VIDEO_URL_EXPIRY_SECONDS }
  );

  return { url, expiresAt };
}

module.exports = {
  VIDEO_URL_EXPIRY_SECONDS,
  buildVideoAssetOutputPrefix,
  buildVideoAssetSourceKey,
  buildVideoObjectKey,
  generateVideoSignedUrl,
  getPrivateR2Config,
  getR2Client,
  getR2Config,
};
