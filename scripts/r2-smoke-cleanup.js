/**
 * Delete R2 objects and optional Mongo records recorded in
 * tmp/r2-smoke-manifest.json. Only run when you are done inspecting.
 */

require("dotenv").config();

const {
  DeleteObjectsCommand,
  ListObjectsV2Command,
} = require("@aws-sdk/client-s3");
const mongoose = require("mongoose");
const {
  getPrivateR2Config,
  getPublicR2Config,
  getR2Client,
  isPrivateR2Configured,
  isPublicR2Configured,
} = require("../lib/r2Config");
const { MANIFEST_PATH, readManifest, writeManifest } = require("./r2SmokeShared");

async function deleteKeys(client, bucketName, keys) {
  const unique = [...new Set(keys.filter(Boolean))];
  let deleted = 0;
  for (let index = 0; index < unique.length; index += 1000) {
    const chunk = unique.slice(index, index + 1000);
    if (chunk.length === 0) continue;
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      })
    );
    deleted += chunk.length;
  }
  return deleted;
}

async function deletePrefix(client, bucketName, prefix) {
  if (!prefix) return 0;
  let deleted = 0;
  let continuationToken;
  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    const keys = (listed.Contents || []).map((object) => object.Key).filter(Boolean);
    deleted += await deleteKeys(client, bucketName, keys);
    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined;
  } while (continuationToken);
  return deleted;
}

async function main() {
  const manifest = readManifest();
  if (!manifest.runs?.length) {
    console.log(`No smoke runs recorded at ${MANIFEST_PATH}`);
    return;
  }

  if (!isPrivateR2Configured() && !isPublicR2Configured()) {
    throw new Error("R2 is not configured; cannot delete smoke objects.");
  }

  const client = getR2Client();
  let publicDeleted = 0;
  let privateDeleted = 0;

  for (const run of manifest.runs) {
    console.log(`Cleaning run ${run.runId || "unknown"} (${run.kind || "unspecified"})`);
    if (isPublicR2Configured()) {
      const bucket = run.publicBucket || getPublicR2Config().bucketName;
      publicDeleted += await deleteKeys(client, bucket, [
        ...(run.publicKeys || []),
        run.isolationPublicKey,
      ]);
    }
    if (isPrivateR2Configured()) {
      const bucket = run.privateBucket || getPrivateR2Config().bucketName;
      privateDeleted += await deleteKeys(client, bucket, [
        ...(run.privateKeys || []),
        run.isolationPrivateKey,
      ]);
      if (run.privatePrefix) {
        privateDeleted += await deletePrefix(client, bucket, run.privatePrefix);
      }
    }

    if (run.mongo && process.env.MONGODB_URI?.trim()) {
      await mongoose.connect(process.env.MONGODB_URI);
      const Course = require("../models/Course");
      const Lesson = require("../models/Lesson");
      const VideoAsset = require("../models/VideoAsset");
      const VideoProcessingJob = require("../models/VideoProcessingJob");
      await Promise.allSettled([
        VideoProcessingJob.deleteOne({ _id: run.mongo.jobId }),
        VideoAsset.deleteOne({ _id: run.mongo.assetId }),
        Lesson.deleteOne({ _id: run.mongo.lessonId }),
        Course.deleteOne({ _id: run.mongo.courseId }),
      ]);
      await mongoose.disconnect();
      console.log(`  removed Mongo course ${run.mongo.slug || run.mongo.courseId}`);
    }
  }

  writeManifest({ createdAt: new Date().toISOString(), runs: [] });
  console.log(
    `Done. Deleted ~${publicDeleted} public and ~${privateDeleted} private object keys.`
  );
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
