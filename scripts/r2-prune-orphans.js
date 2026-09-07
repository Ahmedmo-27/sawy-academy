/**
 * Prune superseded video/document assets and stale staging files from Cloudflare R2 and MongoDB.
 *
 * Usage:
 *   node scripts/r2-prune-orphans.js [--dry-run] [--retention-days=N]
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { DeleteObjectsCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const VideoAsset = require("../models/VideoAsset");
const VideoProcessingJob = require("../models/VideoProcessingJob");
const DocumentAsset = require("../models/DocumentAsset");
const {
  getPrivateR2Config,
  getR2Client,
  isPrivateR2Configured,
} = require("../lib/r2Config");
const { deletePrefix } = require("../lib/videoR2Storage");

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  let retentionDays = 0;
  for (const arg of args) {
    if (arg.startsWith("--retention-days=")) {
      const parsed = Number(arg.split("=")[1]);
      if (Number.isFinite(parsed) && parsed >= 0) {
        retentionDays = parsed;
      }
    }
  }
  return { dryRun, retentionDays };
}

async function pruneSupersededVideos(client, bucketName, cutoffDate, dryRun) {
  console.log("\n--- Checking Superseded Video Assets ---");
  const query = {
    status: "superseded",
    ...(cutoffDate ? { updatedAt: { $lte: cutoffDate } } : {}),
  };

  const supersededVideos = await VideoAsset.find(query).select(
    "+source.objectKey +outputPrefix"
  );
  console.log(`Found ${supersededVideos.length} superseded video asset(s) to prune.`);

  let totalPruned = 0;
  for (const asset of supersededVideos) {
    console.log(`  [Video] Asset ID: ${asset._id} (generation: ${asset.generation})`);
    if (!dryRun) {
      const stagingPrefix = `${asset.outputPrefix.slice(0, -4)}staging/`;
      await Promise.all([
        deletePrefix(asset.outputPrefix, bucketName),
        deletePrefix(stagingPrefix, bucketName),
      ]).catch((err) => console.warn(`    Warning deleting prefixes: ${err.message}`));

      if (asset.source?.objectKey) {
        await deletePrefix(asset.source.objectKey, bucketName).catch(() => {});
      }

      await VideoProcessingJob.deleteMany({ assetId: asset._id });
      await VideoAsset.deleteOne({ _id: asset._id });
    }
    totalPruned += 1;
  }
  return totalPruned;
}

async function pruneSupersededDocs(client, bucketName, cutoffDate, dryRun) {
  console.log("\n--- Checking Superseded Document Assets ---");
  const query = {
    status: "superseded",
    ...(cutoffDate ? { updatedAt: { $lte: cutoffDate } } : {}),
  };

  const supersededDocs = await DocumentAsset.find(query).select("+objectKey");
  console.log(`Found ${supersededDocs.length} superseded document asset(s) to prune.`);

  let totalPruned = 0;
  for (const doc of supersededDocs) {
    console.log(`  [Document] Asset ID: ${doc._id} (filename: ${doc.filename})`);
    if (!dryRun) {
      if (doc.objectKey) {
        await deletePrefix(doc.objectKey, bucketName).catch(() => {});
      }
      await DocumentAsset.deleteOne({ _id: doc._id });
    }
    totalPruned += 1;
  }
  return totalPruned;
}

async function pruneOrphanedStaging(client, bucketName, dryRun) {
  console.log("\n--- Checking Orphaned Staging Prefixes ---");
  let continuationToken;
  let stagingKeys = [];

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: "video-assets/",
        ContinuationToken: continuationToken,
      })
    );

    const contents = response.Contents || [];
    for (const obj of contents) {
      if (obj.Key && obj.Key.includes("/staging/")) {
        // Check if older than 24 hours
        const ageMs = Date.now() - new Date(obj.LastModified).getTime();
        if (ageMs > 24 * 60 * 60 * 1000) {
          stagingKeys.push(obj.Key);
        }
      }
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);

  console.log(`Found ${stagingKeys.length} stale staging object(s) older than 24h.`);

  if (stagingKeys.length > 0 && !dryRun) {
    // Delete in chunks of 500
    for (let i = 0; i < stagingKeys.length; i += 500) {
      const chunk = stagingKeys.slice(i, i + 500);
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: {
            Objects: chunk.map((k) => ({ Key: k })),
            Quiet: true,
          },
        })
      );
    }
  }

  return stagingKeys.length;
}

async function main() {
  const { dryRun, retentionDays } = parseArgs();
  console.log("R2 Storage Maintenance & Orphan Pruning");
  console.log(`  Mode: ${dryRun ? "DRY RUN (no objects deleted)" : "LIVE PURGE"}`);
  console.log(`  Retention window: ${retentionDays} day(s)`);

  if (!isPrivateR2Configured()) {
    console.error("Private R2 is not configured in .env. Exiting.");
    process.exitCode = 1;
    return;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI is not set in .env. Exiting.");
    process.exitCode = 1;
    return;
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const client = getR2Client();
  const bucketName = getPrivateR2Config().bucketName;
  const cutoffDate =
    retentionDays > 0
      ? new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
      : null;

  try {
    const prunedVideos = await pruneSupersededVideos(
      client,
      bucketName,
      cutoffDate,
      dryRun
    );
    const prunedDocs = await pruneSupersededDocs(
      client,
      bucketName,
      cutoffDate,
      dryRun
    );
    const prunedStaging = await pruneOrphanedStaging(
      client,
      bucketName,
      dryRun
    );

    console.log("\n=== Summary ===");
    console.log(`  Superseded video assets pruned: ${prunedVideos}`);
    console.log(`  Superseded document assets pruned: ${prunedDocs}`);
    console.log(`  Stale staging objects purged: ${prunedStaging}`);
    console.log(dryRun ? "Dry run completed successfully." : "Purge completed successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Error during R2 pruning:", err);
    process.exit(1);
  });
}

module.exports = { main, parseArgs };
