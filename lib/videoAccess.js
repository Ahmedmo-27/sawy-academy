const path = require("path");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const VIDEO_URL_EXPIRY_SECONDS = 4 * 60 * 60;
const REQUIRED_R2_ENV = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

let r2Client;

function getR2Config() {
  const missing = REQUIRED_R2_ENV.filter((name) => !process.env[name]?.trim());
  if (missing.length > 0) {
    throw new Error(`Missing R2 configuration: ${missing.join(", ")}`);
  }

  return {
    accountId: process.env.R2_ACCOUNT_ID.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
    bucketName: process.env.R2_BUCKET_NAME.trim(),
  };
}

function getR2Client() {
  if (r2Client) return r2Client;

  const config = getR2Config();
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return r2Client;
}

function safeKeySegment(value, fallback) {
  const segment = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return segment || fallback;
}

function safeVideoFilename(filename) {
  const parsed = path.parse(String(filename || "lesson-video.mp4"));
  const basename = safeKeySegment(parsed.name, "lesson-video").slice(0, 120);
  const extension = parsed.ext.toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${basename}${extension || ".mp4"}`;
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

  const config = getR2Config();
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
  getR2Client,
  getR2Config,
};
