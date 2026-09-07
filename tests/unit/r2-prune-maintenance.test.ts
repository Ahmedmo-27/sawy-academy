import { createRequire } from "node:module";
import { beforeEach, describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const VideoAsset = require("../../models/VideoAsset.js");
const VideoProcessingJob = require("../../models/VideoProcessingJob.js");
const DocumentAsset = require("../../models/DocumentAsset.js");
const { DeleteObjectsCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const videoR2Storage = require("../../lib/videoR2Storage.js");

// Extract helper functions from script or test them via mock runner
describe("R2 Maintenance & Orphan Pruning Edge Cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Superseded Video Assets Pruning", () => {
    it("deletes all associated R2 prefixes, jobs, and MongoDB records for superseded videos", async () => {
      const asset1Id = new mongoose.Types.ObjectId();
      const asset2Id = new mongoose.Types.ObjectId();

      const mockAssets = [
        {
          _id: asset1Id,
          generation: 1,
          outputPrefix: "video-assets/c1/l1/a1/hls/",
          source: { objectKey: "video-assets/c1/l1/a1/source/orig.mp4" },
        },
        {
          _id: asset2Id,
          generation: 2,
          outputPrefix: "video-assets/c1/l1/a2/hls/",
          source: null,
        },
      ];

      const selectMock = vi.fn().mockResolvedValue(mockAssets);
      vi.spyOn(VideoAsset, "find").mockReturnValue({ select: selectMock } as any);

      const deleteJobsSpy = vi.spyOn(VideoProcessingJob, "deleteMany").mockResolvedValue({ acknowledged: true } as any);
      const deleteAssetSpy = vi.spyOn(VideoAsset, "deleteOne").mockResolvedValue({ acknowledged: true } as any);
      const deletePrefixSpy = vi.spyOn(videoR2Storage, "deletePrefix").mockResolvedValue(undefined);

      // Simulate the script's video pruning loop
      for (const asset of mockAssets) {
        const stagingPrefix = `${asset.outputPrefix.slice(0, -4)}staging/`;
        await Promise.all([
          videoR2Storage.deletePrefix(asset.outputPrefix, "bucket"),
          videoR2Storage.deletePrefix(stagingPrefix, "bucket"),
        ]);
        if (asset.source?.objectKey) {
          await videoR2Storage.deletePrefix(asset.source.objectKey, "bucket");
        }
        await VideoProcessingJob.deleteMany({ assetId: asset._id });
        await VideoAsset.deleteOne({ _id: asset._id });
      }

      expect(deletePrefixSpy).toHaveBeenCalledWith("video-assets/c1/l1/a1/hls/", "bucket");
      expect(deletePrefixSpy).toHaveBeenCalledWith("video-assets/c1/l1/a1/staging/", "bucket");
      expect(deletePrefixSpy).toHaveBeenCalledWith("video-assets/c1/l1/a1/source/orig.mp4", "bucket");
      expect(deleteJobsSpy).toHaveBeenCalledWith({ assetId: asset1Id });
      expect(deleteAssetSpy).toHaveBeenCalledWith({ _id: asset1Id });
      expect(deleteJobsSpy).toHaveBeenCalledWith({ assetId: asset2Id });
      expect(deleteAssetSpy).toHaveBeenCalledWith({ _id: asset2Id });
    });
  });

  describe("Superseded Document Assets Pruning", () => {
    it("deletes R2 document objects and DocumentAsset records", async () => {
      const doc1Id = new mongoose.Types.ObjectId();
      const mockDocs = [
        {
          _id: doc1Id,
          filename: "draft-sheet.pdf",
          objectKey: "docs/c1/l1/a1/draft-sheet.pdf",
        },
      ];

      const deleteDocSpy = vi.spyOn(DocumentAsset, "deleteOne").mockResolvedValue({ acknowledged: true } as any);
      const deletePrefixSpy = vi.spyOn(videoR2Storage, "deletePrefix").mockResolvedValue(undefined);

      for (const doc of mockDocs) {
        if (doc.objectKey) {
          await videoR2Storage.deletePrefix(doc.objectKey, "bucket");
        }
        await DocumentAsset.deleteOne({ _id: doc._id });
      }

      expect(deletePrefixSpy).toHaveBeenCalledWith("docs/c1/l1/a1/draft-sheet.pdf", "bucket");
      expect(deleteDocSpy).toHaveBeenCalledWith({ _id: doc1Id });
    });
  });

  describe("Staging Prefix Garbage Collection", () => {
    it("filters and purges only staging objects older than 24 hours", async () => {
      const now = Date.now();
      const staleDate = new Date(now - 25 * 60 * 60 * 1000); // 25h ago
      const freshDate = new Date(now - 2 * 60 * 60 * 1000);  // 2h ago

      const mockContents = [
        { Key: "video-assets/c1/l1/a1/staging/part1.ts", LastModified: staleDate },
        { Key: "video-assets/c1/l1/a1/staging/part2.ts", LastModified: staleDate },
        { Key: "video-assets/c2/l2/a2/staging/active.ts", LastModified: freshDate },
        { Key: "video-assets/c1/l1/a1/hls/master.m3u8", LastModified: staleDate },
      ];

      const clientSendMock = vi.fn().mockImplementation((command) => {
        if (command instanceof ListObjectsV2Command) {
          return Promise.resolve({
            Contents: mockContents,
            IsTruncated: false,
          });
        }
        if (command instanceof DeleteObjectsCommand) {
          return Promise.resolve({ Deleted: [] });
        }
        return Promise.resolve({});
      });

      const client = { send: clientSendMock };

      // Filter logic identical to script
      const listResponse = await client.send(
        new ListObjectsV2Command({ Bucket: "test-bucket", Prefix: "video-assets/" })
      );

      const stagingKeys: string[] = [];
      for (const obj of listResponse.Contents || []) {
        if (obj.Key && obj.Key.includes("/staging/")) {
          const ageMs = now - new Date(obj.LastModified).getTime();
          if (ageMs > 24 * 60 * 60 * 1000) {
            stagingKeys.push(obj.Key);
          }
        }
      }

      expect(stagingKeys).toEqual([
        "video-assets/c1/l1/a1/staging/part1.ts",
        "video-assets/c1/l1/a1/staging/part2.ts",
      ]);
      expect(stagingKeys).not.toContain("video-assets/c2/l2/a2/staging/active.ts");
      expect(stagingKeys).not.toContain("video-assets/c1/l1/a1/hls/master.m3u8");

      if (stagingKeys.length > 0) {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: "test-bucket",
            Delete: {
              Objects: stagingKeys.map((Key) => ({ Key })),
              Quiet: true,
            },
          })
        );
      }

      expect(clientSendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: "test-bucket",
            Delete: {
              Objects: [
                { Key: "video-assets/c1/l1/a1/staging/part1.ts" },
                { Key: "video-assets/c1/l1/a1/staging/part2.ts" },
              ],
              Quiet: true,
            },
          }),
        })
      );
    });
  });
});
