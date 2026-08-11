/**
 * Shared helpers for live R2 smoke tests and scripts.
 * Probe objects are recorded in tmp/r2-smoke-manifest.json and left in
 * the buckets until `npm run r2:smoke-cleanup` is run.
 */

const fs = require("fs");
const path = require("path");
const { HeadBucketCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

const MANIFEST_PATH = path.join(process.cwd(), "tmp", "r2-smoke-manifest.json");

/** 1x1 PNG */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

function newRunId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function ensureManifestDir() {
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
}

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { createdAt: new Date().toISOString(), runs: [] };
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

function writeManifest(manifest) {
  ensureManifestDir();
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
}

function recordSmokeRun(entry) {
  const manifest = readManifest();
  manifest.runs.push({
    recordedAt: new Date().toISOString(),
    ...entry,
  });
  writeManifest(manifest);
  return MANIFEST_PATH;
}

async function headBucket(client, bucketName) {
  await client.send(new HeadBucketCommand({ Bucket: bucketName }));
}

async function objectExists(client, bucketName, objectKey) {
  try {
    await client.send(
      new HeadObjectCommand({ Bucket: bucketName, Key: objectKey })
    );
    return true;
  } catch (error) {
    const status = error.$metadata?.httpStatusCode || error.$response?.statusCode;
    if (status === 404 || error.name === "NotFound" || error.Code === "NotFound") {
      return false;
    }
    throw error;
  }
}

async function fetchPublicUrl(baseUrl, objectKey) {
  const origin = String(baseUrl || "").replace(/\/+$/, "");
  const url = `${origin}/${String(objectKey).replace(/^\/+/, "")}`;
  const response = await fetch(url, { redirect: "follow" });
  const body = Buffer.from(await response.arrayBuffer());
  return { url, status: response.status, body };
}

function isDeniedHttpStatus(status) {
  return status === 401 || status === 403 || status === 404;
}

module.exports = {
  MANIFEST_PATH,
  TINY_PNG,
  fetchPublicUrl,
  headBucket,
  isDeniedHttpStatus,
  newRunId,
  objectExists,
  readManifest,
  recordSmokeRun,
  writeManifest,
};
