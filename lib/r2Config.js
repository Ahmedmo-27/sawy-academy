/**
 * Dual-bucket Cloudflare R2 configuration.
 *
 * Private (`R2_BUCKET_NAME`): lesson video + docs — never public.
 * Public (`R2_PUBLIC_BUCKET_NAME`): website-assets — CDN / custom domain.
 *
 * Both buckets share the same account credentials. The S3 client is shared;
 * Put/Get always pass the target bucket name explicitly.
 */

const SHARED_R2_ENV = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
];

const PRIVATE_R2_ENV = [...SHARED_R2_ENV, "R2_BUCKET_NAME"];
const PUBLIC_R2_ENV = [
  ...SHARED_R2_ENV,
  "R2_PUBLIC_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
];

const { S3Client } = require("@aws-sdk/client-s3");

let r2Client;

function missingEnv(names) {
  return names.filter((name) => !process.env[name]?.trim());
}

function sharedCredentials() {
  const missing = missingEnv(SHARED_R2_ENV);
  if (missing.length > 0) {
    throw new Error(`Missing R2 configuration: ${missing.join(", ")}`);
  }

  return {
    accountId: process.env.R2_ACCOUNT_ID.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY.trim(),
  };
}

/** Private lesson bucket (video-assets/, docs/). Alias: getR2Config. */
function getPrivateR2Config() {
  const missing = missingEnv(PRIVATE_R2_ENV);
  if (missing.length > 0) {
    throw new Error(`Missing R2 configuration: ${missing.join(", ")}`);
  }

  const credentials = sharedCredentials();
  return {
    ...credentials,
    bucketName: process.env.R2_BUCKET_NAME.trim(),
    kind: "private",
  };
}

/** @deprecated Prefer getPrivateR2Config; kept for video/FFmpeg call sites. */
function getR2Config() {
  return getPrivateR2Config();
}

function isPrivateR2Configured() {
  return missingEnv(PRIVATE_R2_ENV).length === 0;
}

function isPublicR2Configured() {
  return missingEnv(PUBLIC_R2_ENV).length === 0;
}

/**
 * Public marketing bucket (website-assets/).
 * Requires R2_PUBLIC_BUCKET_NAME and R2_PUBLIC_BASE_URL (CDN / custom domain origin).
 */
function getPublicR2Config() {
  const missing = missingEnv(PUBLIC_R2_ENV);
  if (missing.length > 0) {
    throw new Error(`Missing public R2 configuration: ${missing.join(", ")}`);
  }

  const credentials = sharedCredentials();
  const baseUrl = process.env.R2_PUBLIC_BASE_URL.trim().replace(/\/+$/, "");

  return {
    ...credentials,
    bucketName: process.env.R2_PUBLIC_BUCKET_NAME.trim(),
    baseUrl,
    kind: "public",
  };
}

function getR2Client() {
  if (r2Client) return r2Client;

  const credentials = sharedCredentials();
  r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${credentials.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });
  return r2Client;
}

/** Public CDN URL for an object key in the public bucket. */
function buildPublicAssetUrl(objectKey) {
  const config = getPublicR2Config();
  const key = String(objectKey || "").replace(/^\/+/, "");
  return `${config.baseUrl}/${key}`;
}

module.exports = {
  PRIVATE_R2_ENV,
  PUBLIC_R2_ENV,
  buildPublicAssetUrl,
  getPrivateR2Config,
  getPublicR2Config,
  getR2Client,
  getR2Config,
  isPrivateR2Configured,
  isPublicR2Configured,
};
