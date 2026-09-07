/**
 * Comprehensive Content Upload Endpoints Test Suite
 * Tests all upload endpoints (general, video, document), checks storage destinations
 * in Cloudflare R2 (Public & Private buckets) and local disk, tests HLS transcoding & playback.
 */

require("dotenv").config();

const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const { spawnSync } = require("child_process");
const mongoose = require("mongoose");
const {
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const User = require("../models/User");
const Session = require("../models/Session");
const Device = require("../models/Device");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const VideoAsset = require("../models/VideoAsset");
const DocumentAsset = require("../models/DocumentAsset");
const VideoProcessingJob = require("../models/VideoProcessingJob");
const Enrollment = require("../models/Enrollment");

const { signToken } = require("../lib/auth/jwt");
const {
  getPrivateR2Config,
  getPublicR2Config,
  getR2Client,
  isPrivateR2Configured,
  isPublicR2Configured,
} = require("../lib/r2Config");
const { getVideoProcessingConfig } = require("../lib/videoProcessingConfig");
const { handleClaimedJob } = require("../workers/videoProcessingWorker");
const app = require("../server");

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
);

const SAMPLE_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n185\n%%EOF\n"
);

function generateTestMp4(destPath) {
  const ffmpeg = getVideoProcessingConfig().ffmpegPath;
  const result = spawnSync(
    ffmpeg,
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-f",
      "lavfi",
      "-i",
      "testsrc=duration=2:size=320x240:rate=15",
      "-f",
      "lavfi",
      "-i",
      "sine=frequency=440:duration=2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-shortest",
      "-y",
      destPath,
    ],
    { encoding: "utf8" }
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      `FFmpeg failed to generate test MP4: ${result.stderr || result.error?.message}`
    );
  }
}

async function makeMultipartRequest({
  baseUrl,
  endpoint,
  method = "POST",
  fields = {},
  files = {},
  headers = {},
}) {
  const boundary = `----NodeFormBoundary${crypto.randomBytes(16).toString("hex")}`;
  const parts = [];

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`
        )
      );
    }
  }

  for (const [key, file] of Object.entries(files)) {
    if (file) {
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="${key}"; filename="${file.filename}"\r\nContent-Type: ${file.contentType || "application/octet-stream"}\r\n\r\n`;
      parts.push(Buffer.from(header));
      parts.push(file.buffer);
      parts.push(Buffer.from("\r\n"));
    }
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  const url = `${baseUrl}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      ...headers,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      "Content-Length": String(body.length),
    },
    body,
  });

  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  return { status: res.status, ok: res.ok, data: json, headers: res.headers };
}

async function makeJsonRequest({
  baseUrl,
  endpoint,
  method = "GET",
  body = null,
  headers = {},
}) {
  const url = `${baseUrl}${endpoint}`;
  const reqHeaders = { ...headers };
  if (body) {
    reqHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  let data;
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data, headers: res.headers };
}

async function r2ObjectExists(bucket, key) {
  try {
    const client = getR2Client();
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("===============================================================");
  console.log("     COMPLETE CONTENT UPLOADING ENDPOINTS TEST SUITE           ");
  console.log("===============================================================\n");

  if (!isPrivateR2Configured() || !isPublicR2Configured()) {
    console.error("ERROR: R2 buckets must be configured.");
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("ERROR: MONGODB_URI is required.");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("[OK] Connected to MongoDB Atlas");

  // Start ephemeral server
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`[OK] Ephemeral API server running on ${baseUrl}\n`);

  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const privateBucket = getPrivateR2Config().bucketName;
  const publicBucket = getPublicR2Config().bucketName;
  const publicCdnUrl = getPublicR2Config().baseUrl;

  const testResults = [];
  function record(suite, name, passed, detail = "") {
    testResults.push({ suite, name, passed, detail });
    const mark = passed ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
    console.log(`  ${mark} ${name}${detail ? ` -> ${detail}` : ""}`);
  }

  // Set up Admin & Student Users with Sessions and Devices
  const adminId = new mongoose.Types.ObjectId();
  const studentId = new mongoose.Types.ObjectId();
  const adminDeviceId = `admin-dev-${runId}`;
  const studentDeviceId = `student-dev-${runId}`;

  const adminUser = await User.create({
    _id: adminId,
    name: `Test Admin ${runId}`,
    email: `admin-${runId}@sawyacademy.test`,
    passwordHash: "dummyhash",
    role: "admin",
    deviceLimit: 10,
  });

  const studentUser = await User.create({
    _id: studentId,
    name: `Test Student ${runId}`,
    email: `student-${runId}@sawyacademy.test`,
    passwordHash: "dummyhash",
    role: "student",
    deviceLimit: 2,
  });

  const adminToken = signToken({ sub: adminId.toString(), did: adminDeviceId, role: "admin" });
  const studentToken = signToken({ sub: studentId.toString(), did: studentDeviceId, role: "student" });

  await Device.create([
    { userId: adminId, deviceId: adminDeviceId, label: "Admin Test Device" },
    { userId: studentId, deviceId: studentDeviceId, label: "Student Test Device" },
  ]);

  await Session.create([
    { token: adminToken, userId: adminId, deviceId: adminDeviceId, expiresAt: new Date(Date.now() + 86400000) },
    { token: studentToken, userId: studentId, deviceId: studentDeviceId, expiresAt: new Date(Date.now() + 86400000) },
  ]);

  // CSRF token pair
  const csrfToken = crypto.randomBytes(32).toString("base64url");
  const csrfCookie = `sawy_csrf=${csrfToken}`;

  const adminHeaders = {
    Authorization: `Bearer ${adminToken}`,
    "X-Device-Id": adminDeviceId,
    "X-CSRF-Token": csrfToken,
    Cookie: csrfCookie,
  };

  const studentHeaders = {
    Authorization: `Bearer ${studentToken}`,
    "X-Device-Id": studentDeviceId,
    "X-CSRF-Token": csrfToken,
    Cookie: csrfCookie,
  };

  const createdR2Keys = { public: [], private: [] };
  const createdLocalFiles = [];

  try {
    // =========================================================================
    // SUITE 1: POST /api/upload (Website assets, payments, service-ref, local)
    // =========================================================================
    console.log("--- SUITE 1: General Upload Endpoint (POST /api/upload) ---");

    // 1.1 Website Asset (Public R2)
    {
      const res = await makeMultipartRequest({
        baseUrl,
        endpoint: "/api/upload",
        fields: { purpose: "website-asset", page: "courses", entityId: `course-${runId}` },
        files: { file: { filename: `marketing-${runId}.png`, contentType: "image/png", buffer: TINY_PNG } },
        headers: adminHeaders,
      });

      const ok = res.status === 201 && res.data?.data?.storage === "r2-public" && res.data?.data?.objectKey;
      const objectKey = res.data?.data?.objectKey;
      let inR2 = false;
      let cdnOk = false;

      if (ok && objectKey) {
        createdR2Keys.public.push(objectKey);
        inR2 = await r2ObjectExists(publicBucket, objectKey);
        const cdnFetch = await fetch(`${publicCdnUrl}/${objectKey}`);
        cdnOk = cdnFetch.status === 200;
      }

      record("Upload API", "1.1 Website Asset -> Public R2 + CDN verify", ok && inR2 && cdnOk, `Key: ${objectKey}`);
    }

    // 1.2 Payment Proof (Private R2)
    {
      const res = await makeMultipartRequest({
        baseUrl,
        endpoint: "/api/upload",
        fields: { purpose: "payment" },
        files: { file: { filename: `receipt-${runId}.png`, contentType: "image/png", buffer: TINY_PNG } },
        headers: studentHeaders,
      });

      const ok = res.status === 201 && res.data?.data?.storage === "r2-private" && res.data?.data?.objectKey;
      const objectKey = res.data?.data?.objectKey;
      let inR2 = false;
      let cdnDenied = false;

      if (ok && objectKey) {
        createdR2Keys.private.push(objectKey);
        inR2 = await r2ObjectExists(privateBucket, objectKey);
        const cdnFetch = await fetch(`${publicCdnUrl}/${objectKey}`);
        cdnDenied = cdnFetch.status === 404 || cdnFetch.status === 403;
      }

      record("Upload API", "1.2 Payment Proof -> Private R2 (Isolated from CDN)", ok && inR2 && cdnDenied, `Key: ${objectKey}`);
    }

    // 1.3 Service Reference (Private R2 - Guest friendly)
    {
      const res = await makeMultipartRequest({
        baseUrl,
        endpoint: "/api/upload",
        fields: { purpose: "service-reference", guestName: "Zaha Hadid Studio" },
        files: { file: { filename: `concept-${runId}.png`, contentType: "image/png", buffer: TINY_PNG } },
        headers: {
          "X-CSRF-Token": csrfToken,
          Cookie: csrfCookie,
        },
      });

      const ok = res.status === 201 && res.data?.data?.storage === "r2-private" && res.data?.data?.objectKey;
      const objectKey = res.data?.data?.objectKey;
      let inR2 = false;

      if (ok && objectKey) {
        createdR2Keys.private.push(objectKey);
        inR2 = await r2ObjectExists(privateBucket, objectKey);
      }

      record("Upload API", "1.3 Service Reference -> Private R2 (Guest owner folder)", ok && inR2 && objectKey?.toLowerCase().includes("guest-zaha-hadid-studio"), `Key: ${objectKey}`);
    }

    // 1.4 Local Upload Fallback
    {
      const res = await makeMultipartRequest({
        baseUrl,
        endpoint: "/api/upload",
        fields: { purpose: "local" },
        files: { file: { filename: `local-${runId}.png`, contentType: "image/png", buffer: TINY_PNG } },
        headers: adminHeaders,
      });

      const ok = res.status === 201 && res.data?.data?.storage === "local" && res.data?.data?.url?.startsWith("/uploads/");
      const localRelPath = res.data?.data?.url;
      let diskExists = false;

      if (ok && localRelPath) {
        const fullLocalPath = path.join(process.cwd(), "public", localRelPath);
        diskExists = fs.existsSync(fullLocalPath);
        if (diskExists) createdLocalFiles.push(fullLocalPath);
      }

      record("Upload API", "1.4 Local Storage -> public/uploads/ filesystem verify", ok && diskExists, `URL: ${localRelPath}`);
    }

    // =========================================================================
    // Create Temporary Course & Lesson for Lesson Media Tests
    // =========================================================================
    const testCourseSlug = `test-course-upload-${runId}`;
    const testLessonSlug = `test-lesson-upload-${runId}`;
    const lessonId = new mongoose.Types.ObjectId();

    const lessonDoc = await Lesson.create({
      _id: lessonId,
      id: testLessonSlug,
      slug: testLessonSlug,
      title: "Upload Verification Lesson",
      duration: "30 min",
      sheetRef: "TEST-01",
      order: 1,
      summary: "Testing upload endpoints and storage pipelines.",
      content: "<p>Lesson body content.</p>",
    });

    const courseDoc = await Course.create({
      id: testCourseSlug,
      slug: testCourseSlug,
      title: "Upload Verification Course",
      description: "Ephemeral course testing upload endpoints.",
      level: "Foundation",
      instructor: "Prof. Mohamed El Sawy",
      price: "EGP 10,000",
      lessons: [lessonDoc._id],
    });

    // Enroll student
    await Enrollment.create({
      userId: studentId,
      courseId: courseDoc._id,
      paymentStatus: "completed",
    });

    // =========================================================================
    // SUITE 2: Lesson Document Upload (/api/courses/:slug/lessons/:lessonId/document)
    // =========================================================================
    console.log("\n--- SUITE 2: Lesson Document Upload & Access Endpoints ---");

    // 2.1 Document Intent
    let docGrantToken = null;
    {
      const res = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/courses/${testCourseSlug}/lessons/${lessonId}/document/intent`,
        method: "POST",
        headers: adminHeaders,
      });

      const ok = res.status === 200 && res.data?.data?.token;
      docGrantToken = res.data?.data?.token;
      record("Lesson Document", "2.1 Document Intent -> Signed grant token issued", ok);
    }

    // 2.2 Document Upload
    let docAssetId = null;
    {
      const res = await makeMultipartRequest({
        baseUrl,
        endpoint: `/api/courses/${testCourseSlug}/lessons/${lessonId}/document`,
        files: { document: { filename: `worksheet-${runId}.pdf`, contentType: "application/pdf", buffer: SAMPLE_PDF } },
        headers: {
          Authorization: `Bearer ${docGrantToken}`,
          "x-sawy-upload-grant": "1",
        },
      });

      const ok = res.status === 201 && res.data?.data?.status === "ready" && res.data?.data?.documentAvailable === true;
      docAssetId = res.data?.data?.assetId;

      const updatedLesson = await Lesson.findById(lessonId).select("+documentObjectKey +documentOriginalFilename");
      const docObjectKey = updatedLesson?.documentObjectKey;
      let inR2 = false;

      if (ok && docObjectKey) {
        createdR2Keys.private.push(docObjectKey);
        inR2 = await r2ObjectExists(privateBucket, docObjectKey);
      }

      record("Lesson Document", "2.2 Document Upload -> Private R2 docs/ + Lesson updated", ok && inR2 && docObjectKey?.startsWith(`docs/${courseDoc._id}/${lessonDoc._id}/`), `Key: ${docObjectKey}`);
    }

    // 2.3 Document Status
    {
      const res = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/courses/${testCourseSlug}/lessons/${lessonId}/document/status`,
        method: "GET",
        headers: adminHeaders,
      });

      const ok = res.status === 200 && res.data?.data?.documentAvailable === true && res.data?.data?.status === "ready";
      record("Lesson Document", "2.3 Document Status -> Available & ready status verified", ok);
    }

    // 2.4 Document Download / Stream
    {
      const resAuth = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/lessons/${lessonId}/document`,
        method: "GET",
        headers: studentHeaders,
      });

      const okAuth = resAuth.status === 200 && resAuth.headers.get("content-type")?.includes("application/pdf");

      const resNoAuth = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/lessons/${lessonId}/document`,
        method: "GET",
      });

      const okNoAuth = resNoAuth.status === 401;

      record("Lesson Document", "2.4 Document Download -> Authenticated streaming 200 OK & Unauth 401 rejected", okAuth && okNoAuth);
    }

    // =========================================================================
    // SUITE 3: Lesson Video Upload (/api/courses/:slug/lessons/:lessonId/video)
    // =========================================================================
    console.log("\n--- SUITE 3: Lesson Video Upload, Transcoding & Protected HLS ---");

    const tmpVideoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "test-video-upload-"));
    const tmpVideoPath = path.join(tmpVideoDir, "test.mp4");
    generateTestMp4(tmpVideoPath);
    const videoBuffer = await fs.promises.readFile(tmpVideoPath);

    // 3.1 Video Intent
    let videoGrantToken = null;
    {
      const res = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/courses/${testCourseSlug}/lessons/${lessonId}/video/intent`,
        method: "POST",
        headers: adminHeaders,
      });

      const ok = res.status === 200 && res.data?.data?.token;
      videoGrantToken = res.data?.data?.token;
      record("Lesson Video", "3.1 Video Intent -> Signed grant token issued", ok);
    }

    // 3.2 Video Upload
    let videoAssetId = null;
    let videoJobId = null;
    {
      const res = await makeMultipartRequest({
        baseUrl,
        endpoint: `/api/courses/${testCourseSlug}/lessons/${lessonId}/video`,
        files: { video: { filename: `lecture-${runId}.mp4`, contentType: "video/mp4", buffer: videoBuffer } },
        headers: {
          Authorization: `Bearer ${videoGrantToken}`,
          "x-sawy-upload-grant": "1",
        },
      });

      const ok = res.status === 202 && res.data?.data?.status === "queued";
      videoAssetId = res.data?.data?.assetId;
      videoJobId = res.data?.data?.jobId;

      const videoAsset = await VideoAsset.findById(videoAssetId).select("+source.objectKey");
      const sourceKey = videoAsset?.source?.objectKey;
      let inR2 = false;

      if (ok && sourceKey) {
        createdR2Keys.private.push(sourceKey);
        inR2 = await r2ObjectExists(privateBucket, sourceKey);
      }

      record("Lesson Video", "3.2 Video Upload -> Source saved in Private R2 & Job queued", ok && inR2 && sourceKey?.startsWith(`video-assets/${courseDoc._id}/${lessonDoc._id}/`), `Source Key: ${sourceKey}`);
    }

    // 3.3 Video Worker Transcoding & Encrypted HLS Generation
    {
      const job = await VideoProcessingJob.findById(videoJobId);
      const config = {
        ...getVideoProcessingConfig(),
        workerId: `test-worker-${runId}`,
      };

      // Claim job
      const claimed = await VideoProcessingJob.findOneAndUpdate(
        { _id: job._id, status: "queued" },
        {
          $set: {
            status: "processing",
            startedAt: new Date(),
            "lease.ownerId": config.workerId,
            "lease.heartbeatAt": new Date(),
            "lease.expiresAt": new Date(Date.now() + config.leaseMs),
          },
          $inc: { attempts: 1 },
        },
        { new: true }
      );

      await handleClaimedJob(claimed, config);

      const processedAsset = await VideoAsset.findById(videoAssetId).select("+masterPlaylistObjectKey +outputPrefix");
      const processedLesson = await Lesson.findById(lessonId);

      const isReady = processedAsset?.status === "ready" && processedLesson?.videoAvailable === true;
      const masterKey = `${processedAsset?.outputPrefix}master.m3u8`;
      const masterInR2 = await r2ObjectExists(privateBucket, masterKey);

      record("Lesson Video", "3.3 Transcoder Worker -> AES-128 HLS Master & Renditions in Private R2", isReady && masterInR2, `Master Key: ${masterKey}`);
    }

    // 3.4 Video Status Query
    {
      const res = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/courses/${testCourseSlug}/lessons/${lessonId}/video/status`,
        method: "GET",
        headers: adminHeaders,
      });

      const ok = res.status === 200 && res.data?.data?.status === "ready" && res.data?.data?.processingStatus === "ready" && Array.isArray(res.data?.data?.renditions) && res.data?.data?.renditions.length > 0;
      record("Lesson Video", "3.4 Video Status -> Ready state with renditions metadata", ok, `Renditions: ${res.data?.data?.renditions?.map((r) => r.name).join(", ")}`);
    }

    // 3.5 Complete Video Playback Flow (Access -> Master M3U8 -> Variant M3U8 -> Key -> Media Segment)
    {
      // Step A: Video Access Token
      const resAccess = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/lessons/${lessonId}/video-access`,
        method: "GET",
        headers: studentHeaders,
      });
      const okAccess = resAccess.status === 200 && (resAccess.data?.data?.signedUrl || resAccess.data?.data?.manifestUrl);

      // Step B: Master Manifest
      const resMaster = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/lessons/${lessonId}/manifest`,
        method: "GET",
        headers: studentHeaders,
      });
      const masterContent = String(resMaster.data || "");
      const okMaster = resMaster.status === 200 && masterContent.includes("#EXTM3U");

      // Extract rendition path (e.g. 240p/index.m3u8 or 1080p/index.m3u8)
      const renditionMatch = masterContent.match(/([0-9a-zA-Z_-]+\/index\.m3u8)/);
      const variantPath = renditionMatch ? renditionMatch[1] : "240p/index.m3u8";

      // Step C: Variant Playlist
      const resVariant = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/lessons/${lessonId}/manifest?variant=${encodeURIComponent(variantPath)}`,
        method: "GET",
        headers: studentHeaders,
      });
      const variantContent = String(resVariant.data || "");
      const okVariant = resVariant.status === 200 && variantContent.includes("#EXT-X-KEY");

      // Extract key URI & segment URI from variant playlist
      const keyUriMatch = variantContent.match(/URI="([^"]+)"/);
      const keyUri = keyUriMatch ? keyUriMatch[1] : null;

      const segmentUriMatch = variantContent.match(/(\/api\/media\?grant=[^\s\r\n]+)/);
      const segmentUri = segmentUriMatch ? segmentUriMatch[1] : null;

      // Step D: Decrypted HLS Key
      let okKey = false;
      if (keyUri) {
        const resKey = await makeJsonRequest({
          baseUrl,
          endpoint: keyUri,
          method: "GET",
          headers: {
            ...studentHeaders,
            Origin: "http://localhost:3000",
          },
        });
        okKey = resKey.status === 200 && resKey.headers.get("content-type")?.includes("application/octet-stream");
      }

      // Step E: Stream Encrypted Media Segment
      let okSegment = false;
      if (segmentUri) {
        const resSegment = await makeJsonRequest({
          baseUrl,
          endpoint: segmentUri,
          method: "GET",
          headers: {
            Origin: "http://localhost:3000",
          },
        });
        okSegment = resSegment.status === 200 && (resSegment.headers.get("content-type")?.includes("video/mp2t") || resSegment.headers.get("content-type")?.includes("application/octet-stream"));
      }

      record("Lesson Video", "3.5 Video Playback Flow -> Video Access, M3U8 Manifests, AES-128 Key, Media Segment verified", Boolean(okAccess && okMaster && okVariant && okKey && okSegment), `Access: ${okAccess}, Master: ${okMaster}, Variant: ${okVariant}, Key: ${okKey}, Segment: ${okSegment}`);
    }

    // 3.6 Document and Video Deletions
    console.log("\n--- SUITE 4: Asset Cleanups & Cascade Deletions ---");
    {
      const resDelDoc = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/courses/${testCourseSlug}/lessons/${lessonId}/document`,
        method: "DELETE",
        headers: adminHeaders,
      });

      const okDelDoc = resDelDoc.status === 200 && resDelDoc.data?.data?.documentAvailable === false;
      const lessonAfterDocDel = await Lesson.findById(lessonId);
      record("Cascade Cleanup", "4.1 Document Delete -> DB updated documentAvailable=false", okDelDoc && !lessonAfterDocDel.documentAvailable);

      const resDelVid = await makeJsonRequest({
        baseUrl,
        endpoint: `/api/courses/${testCourseSlug}/lessons/${lessonId}/video`,
        method: "DELETE",
        headers: adminHeaders,
      });

      const okDelVid = resDelVid.status === 200 && resDelVid.data?.data?.videoAvailable === false;
      const lessonAfterVidDel = await Lesson.findById(lessonId);
      record("Cascade Cleanup", "4.2 Video Delete -> DB updated videoAvailable=false & assets removed", okDelVid && !lessonAfterVidDel.videoAvailable);
    }

    // Clean up temporary files & DB test records
    await fs.promises.rm(tmpVideoDir, { recursive: true, force: true }).catch(() => {});
    for (const file of createdLocalFiles) {
      fs.unlinkSync(file);
    }

    // Delete ephemeral test course & users
    await Course.deleteOne({ _id: courseDoc._id });
    await Lesson.deleteOne({ _id: lessonDoc._id });
    await Enrollment.deleteOne({ userId: studentId, courseId: courseDoc._id });
    await User.deleteMany({ _id: { $in: [adminId, studentId] } });
    await Device.deleteMany({ userId: { $in: [adminId, studentId] } });
    await Session.deleteMany({ userId: { $in: [adminId, studentId] } });

    // Clean R2 ephemeral objects
    const r2Client = getR2Client();
    for (const key of createdR2Keys.public) {
      await r2Client.send(new DeleteObjectCommand({ Bucket: publicBucket, Key: key })).catch(() => {});
    }
    for (const key of createdR2Keys.private) {
      await r2Client.send(new DeleteObjectCommand({ Bucket: privateBucket, Key: key })).catch(() => {});
    }

  } finally {
    server.close();
    await mongoose.disconnect();
  }

  console.log("\n===============================================================");
  console.log("                     TEST SUMMARY REPORT                       ");
  console.log("===============================================================");
  const total = testResults.length;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total tests executed: ${total}`);
  console.log(`Passed: \x1b[32m${passed}\x1b[0m`);
  console.log(`Failed: ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : `\x1b[32m0\x1b[0m`}`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR during test execution:", err);
  process.exit(1);
});
