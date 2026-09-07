/**
 * Verify Demo Course Playback and Documents
 */

require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const User = require("../models/User");
const Device = require("../models/Device");
const Session = require("../models/Session");
const Enrollment = require("../models/Enrollment");
const { signToken } = require("../lib/auth/jwt");
const app = require("../server");

async function verifyDemo() {
  await mongoose.connect(process.env.MONGODB_URI);
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const course = await Course.findOne({ slug: "parametric-form-algorithmic-design" }).populate("lessons");
  console.log("Verifying course:", course.title, "Lessons count:", course.lessons.length);

  let lessonIdx = 0;
  let allPassed = true;

  for (const lesson of course.lessons) {
    lessonIdx++;
    console.log(`\nChecking Lesson ${lessonIdx}: "${lesson.title}" (${lesson.sheetRef})`);

    const studentId = new mongoose.Types.ObjectId();
    const studentUser = await User.create({
      _id: studentId,
      name: `Verifier ${lessonIdx}`,
      email: `verifier-${lessonIdx}-${Date.now()}@sawyacademy.test`,
      passwordHash: "dummyhash",
      role: "student",
      deviceLimit: 5,
    });
    const deviceId = `verify-demo-dev-${lessonIdx}-${Date.now()}`;
    await Device.create({ userId: studentId, deviceId, label: `Verifier ${lessonIdx}` });
    const token = signToken({ sub: studentId.toString(), did: deviceId, role: "student" });
    await Session.create({ token, userId: studentId, deviceId, expiresAt: new Date(Date.now() + 86400000) });
    await Enrollment.create({ userId: studentId, courseId: course._id, paymentStatus: "completed" });

    const headers = {
      Authorization: `Bearer ${token}`,
      "X-Device-Id": deviceId,
      Origin: "http://localhost:3000",
    };

    // 1. Video Access
    const accRes = await fetch(`${baseUrl}/api/lessons/${lesson._id}/video-access`, { headers });
    const accData = await accRes.json();
    const accOk = accRes.status === 200 && Boolean(accData.data?.signedUrl);
    console.log(`  [${accOk ? "OK" : "FAIL"}] Video Access (200): ${accData.data?.signedUrl}`);
    if (!accOk) allPassed = false;

    // 2. Manifest
    const manRes = await fetch(`${baseUrl}/api/lessons/${lesson._id}/manifest`, { headers });
    const manText = await manRes.text();
    const manOk = manRes.status === 200 && manText.includes("#EXTM3U");
    console.log(`  [${manOk ? "OK" : "FAIL"}] Master Manifest (200 M3U8): ${manOk}`);
    if (!manOk) allPassed = false;

    // Extract variant
    const variantMatch = manText.match(/([0-9a-zA-Z_-]+\/index\.m3u8)/);
    const variantPath = variantMatch ? variantMatch[1] : "360p/index.m3u8";

    // 3. Variant Playlist
    const varRes = await fetch(
      `${baseUrl}/api/lessons/${lesson._id}/manifest?variant=${encodeURIComponent(variantPath)}`,
      { headers }
    );
    const varText = await varRes.text();
    const varOk = varRes.status === 200 && varText.includes("#EXT-X-KEY");
    console.log(`  [${varOk ? "OK" : "FAIL"}] Variant Playlist (200): ${varOk} (${variantPath})`);
    if (!varOk) allPassed = false;

    // 4. HLS Key
    const keyMatch = varText.match(/URI="([^"]+)"/);
    if (keyMatch) {
      const keyRes = await fetch(`${baseUrl}${keyMatch[1]}`, { headers });
      const keyBuf = await keyRes.arrayBuffer();
      const keyOk = keyRes.status === 200 && keyBuf.byteLength === 16;
      console.log(`  [${keyOk ? "OK" : "FAIL"}] Decrypted AES-128 Key (200, 16 bytes): ${keyOk}`);
      if (!keyOk) allPassed = false;
    }

    // 5. Media Segment
    const segMatch = varText.match(/(\/api\/media\?grant=[^\s\r\n]+)/);
    if (segMatch) {
      const segRes = await fetch(`${baseUrl}${segMatch[1]}`, {
        headers: { Origin: "http://localhost:3000" },
      });
      const segOk = segRes.status === 200;
      console.log(`  [${segOk ? "OK" : "FAIL"}] Encrypted Video Segment (200 OK): ${segOk}`);
      if (!segOk) allPassed = false;
    }

    // 6. Document Download
    const docRes = await fetch(`${baseUrl}/api/lessons/${lesson._id}/document`, { headers });
    const docBuf = await docRes.arrayBuffer();
    const docOk =
      docRes.status === 200 &&
      Buffer.from(docBuf.slice(0, 4)).toString() === "%PDF";
    console.log(
      `  [${docOk ? "OK" : "FAIL"}] PDF Worksheet Download (200, %PDF, ${docBuf.byteLength} bytes): ${docOk}`
    );
    if (!docOk) allPassed = false;
  }

  server.close();
  await mongoose.disconnect();

  console.log("\n===============================================================");
  if (allPassed) {
    console.log("  >>> ALL DEMO LESSONS & MEDIA ENDPOINTS VERIFIED 100% OK! <<<");
  } else {
    console.log("  >>> SOME CHECKS FAILED <<<");
    process.exit(1);
  }
  console.log("===============================================================\n");
}

verifyDemo().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
