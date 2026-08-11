/**
 * Print what both R2 buckets need, then HeadBucket / optional CDN probe.
 * Does not delete anything.
 */

require("dotenv").config();

const {
  getPrivateR2Config,
  getPublicR2Config,
  getR2Client,
  isPrivateR2Configured,
  isPublicR2Configured,
} = require("../lib/r2Config");
const { headBucket } = require("./r2SmokeShared");

function row(label, ok, detail) {
  const mark = ok ? "ok" : "MISSING";
  console.log(`  [${mark}] ${label}${detail ? ` — ${detail}` : ""}`);
  return ok;
}

async function checkFfmpeg() {
  const { spawnSync } = require("child_process");
  const bin = String(process.env.FFMPEG_PATH || "ffmpeg").trim();
  const result = spawnSync(bin, ["-version"], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    return { ok: false, detail: result.error?.message || "not on PATH" };
  }
  const first = String(result.stdout || "").split("\n")[0] || bin;
  return { ok: true, detail: first.trim() };
}

function kekReady() {
  const value = String(process.env.VIDEO_KEY_KEK || "").trim();
  if (!value) return { ok: false, detail: "VIDEO_KEY_KEK unset" };
  if (/^[a-fA-F0-9]{64}$/.test(value)) {
    return { ok: true, detail: "hex 32-byte KEK" };
  }
  try {
    const decoded = Buffer.from(value, "base64");
    if (decoded.length === 32) {
      return { ok: true, detail: "base64 32-byte KEK" };
    }
  } catch {
    /* ignore */
  }
  return { ok: false, detail: "not a 32-byte hex/base64 key" };
}

async function main() {
  console.log("R2 bucket readiness\n");
  console.log("Expected layout:");
  console.log("  Public  R2_PUBLIC_BUCKET_NAME + R2_PUBLIC_BASE_URL");
  console.log("          website-assets/ only; anonymous CDN GET; write via API token");
  console.log("  Private R2_BUCKET_NAME");
  console.log("          video-assets/, docs/, payments/, service-references/");
  console.log("          no public r2.dev / custom domain; Worker + API only\n");

  console.log("Environment");
  const shared = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];
  let envOk = true;
  for (const name of shared) {
    envOk =
      row(name, Boolean(process.env[name]?.trim()), process.env[name] ? "set" : "") &&
      envOk;
  }
  envOk =
    row(
      "R2_BUCKET_NAME",
      Boolean(process.env.R2_BUCKET_NAME?.trim()),
      process.env.R2_BUCKET_NAME?.trim() || ""
    ) && envOk;
  envOk =
    row(
      "R2_PUBLIC_BUCKET_NAME",
      Boolean(process.env.R2_PUBLIC_BUCKET_NAME?.trim()),
      process.env.R2_PUBLIC_BUCKET_NAME?.trim() || ""
    ) && envOk;
  envOk =
    row(
      "R2_PUBLIC_BASE_URL",
      Boolean(process.env.R2_PUBLIC_BASE_URL?.trim()),
      process.env.R2_PUBLIC_BASE_URL?.trim() || ""
    ) && envOk;
  row("MONGODB_URI", Boolean(process.env.MONGODB_URI?.trim()), "needed for course video smoke");
  const kek = kekReady();
  row("VIDEO_KEY_KEK", kek.ok, kek.detail);
  row(
    "VIDEO_KEY_KEK_VERSION",
    Boolean(process.env.VIDEO_KEY_KEK_VERSION?.trim()),
    process.env.VIDEO_KEY_KEK_VERSION?.trim() || "defaults to v1"
  );
  const ffmpeg = await checkFfmpeg();
  row("ffmpeg", ffmpeg.ok, ffmpeg.detail);

  console.log("\nHelpers");
  row("isPrivateR2Configured()", isPrivateR2Configured());
  row("isPublicR2Configured()", isPublicR2Configured());

  if (!isPrivateR2Configured() && !isPublicR2Configured()) {
    console.log("\nNo R2 credentials. Fill .env then re-run npm run r2:check.");
    process.exitCode = 1;
    return;
  }

  const client = getR2Client();
  console.log("\nLive HeadBucket");
  if (isPrivateR2Configured()) {
    const privateConfig = getPrivateR2Config();
    try {
      await headBucket(client, privateConfig.bucketName);
      row(`private ${privateConfig.bucketName}`, true, "reachable");
    } catch (error) {
      row(`private ${privateConfig.bucketName}`, false, error.message);
      process.exitCode = 1;
    }
  }
  if (isPublicR2Configured()) {
    const publicConfig = getPublicR2Config();
    try {
      await headBucket(client, publicConfig.bucketName);
      row(`public ${publicConfig.bucketName}`, true, publicConfig.baseUrl);
    } catch (error) {
      row(`public ${publicConfig.bucketName}`, false, error.message);
      process.exitCode = 1;
    }
  }

  console.log("\nNext:");
  console.log("  npm run test:r2              live dual-bucket contract (keeps objects)");
  console.log("  npm run r2:smoke-video       upload + optional FFmpeg (keeps objects)");
  console.log("  npm run r2:smoke-cleanup     delete recorded smoke objects when you are ready");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
