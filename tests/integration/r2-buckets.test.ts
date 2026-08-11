import { createRequire } from "node:module";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import mongoose from "mongoose";
import { afterAll, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

const {
  buildPublicAssetUrl,
  getPrivateR2Config,
  getPublicR2Config,
  getR2Client,
  isPrivateR2Configured,
  isPublicR2Configured,
} = require("../../lib/r2Config.js") as {
  buildPublicAssetUrl: (objectKey: string) => string;
  getPrivateR2Config: () => { bucketName: string };
  getPublicR2Config: () => { bucketName: string; baseUrl: string };
  getR2Client: () => {
    send: (command: unknown) => Promise<unknown>;
  };
  isPrivateR2Configured: () => boolean;
  isPublicR2Configured: () => boolean;
};

const { putPublicWebsiteAsset } = require("../../lib/publicR2Storage.js") as {
  putPublicWebsiteAsset: (input: {
    body: Buffer;
    contentType: string;
    filename: string;
    page: string;
  }) => Promise<{ objectKey: string; url: string; bucket: string }>;
};

const { putPrivateObject } = require("../../lib/privateR2Storage.js") as {
  putPrivateObject: (input: {
    objectKey: string;
    body: Buffer;
    contentType: string;
  }) => Promise<{ objectKey: string; bucket: string }>;
};

const {
  buildLessonDocKey,
  buildPaymentProofKey,
  buildServiceReferenceKey,
} = require("../../lib/r2ObjectKeys.js") as {
  buildLessonDocKey: (
    courseId: string,
    lessonId: string,
    assetId: string,
    filename: string
  ) => string;
  buildPaymentProofKey: (userId: string, filename: string) => string;
  buildServiceReferenceKey: (ownerSegment: string, filename: string) => string;
};

const { buildVideoAssetSourceKey } = require("../../lib/videoAccess.js") as {
  buildVideoAssetSourceKey: (
    courseId: string,
    lessonId: string,
    assetId: string,
    filename: string
  ) => string;
};

const {
  TINY_PNG,
  fetchPublicUrl,
  headBucket,
  isDeniedHttpStatus,
  newRunId,
  objectExists,
  recordSmokeRun,
} = require("../../scripts/r2SmokeShared.js") as {
  TINY_PNG: Buffer;
  fetchPublicUrl: (
    baseUrl: string,
    objectKey: string
  ) => Promise<{ url: string; status: number; body: Buffer }>;
  headBucket: (client: unknown, bucketName: string) => Promise<void>;
  isDeniedHttpStatus: (status: number) => boolean;
  newRunId: () => string;
  objectExists: (
    client: unknown,
    bucketName: string,
    objectKey: string
  ) => Promise<boolean>;
  recordSmokeRun: (entry: Record<string, unknown>) => string;
};

const liveReady = isPrivateR2Configured() && isPublicR2Configured();

const SMOKE_PDF = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");
const SMOKE_MP4 = Buffer.from("ftypisom", "utf8");

async function readObjectBody(
  client: { send: (command: unknown) => Promise<{ Body?: AsyncIterable<Uint8Array> }> },
  bucket: string,
  key: string
) {
  const response = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );
  const chunks: Buffer[] = [];
  if (!response.Body) {
    return Buffer.alloc(0);
  }
  for await (const chunk of response.Body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

describe.skipIf(!liveReady)("live R2 dual-bucket contract", () => {
  const runId = newRunId();
  const ids = {
    course: new mongoose.Types.ObjectId().toString(),
    lesson: new mongoose.Types.ObjectId().toString(),
    asset: new mongoose.Types.ObjectId().toString(),
    user: new mongoose.Types.ObjectId().toString(),
  };

  const created: {
    publicKeys: string[];
    privateKeys: string[];
    isolationPublicKey: string | null;
    isolationPrivateKey: string | null;
  } = {
    publicKeys: [],
    privateKeys: [],
    isolationPublicKey: null,
    isolationPrivateKey: null,
  };

  afterAll(() => {
    recordSmokeRun({
      kind: "integration-buckets",
      runId,
      keepUntilCleanup: true,
      publicBucket: getPublicR2Config().bucketName,
      privateBucket: getPrivateR2Config().bucketName,
      publicKeys: created.publicKeys,
      privateKeys: created.privateKeys,
      isolationPublicKey: created.isolationPublicKey,
      isolationPrivateKey: created.isolationPrivateKey,
    });
  });

  it("can HeadBucket both the public and private buckets", async () => {
    const client = getR2Client();
    await headBucket(client, getPublicR2Config().bucketName);
    await headBucket(client, getPrivateR2Config().bucketName);
  });

  it("puts a website-assets image on the public bucket and serves it from the CDN", async () => {
    const uploaded = await putPublicWebsiteAsset({
      body: TINY_PNG,
      contentType: "image/png",
      filename: `_r2-smoke-${runId}.png`,
      page: "shared",
    });
    created.publicKeys.push(uploaded.objectKey);

    expect(uploaded.objectKey).toMatch(
      new RegExp(`^website-assets/shared/\\d+-[a-z0-9]+-_r2-smoke-${runId}\\.png$`)
    );
    expect(uploaded.url).toBe(buildPublicAssetUrl(uploaded.objectKey));

    const client = getR2Client();
    const publicBucket = getPublicR2Config().bucketName;
    expect(await objectExists(client, publicBucket, uploaded.objectKey)).toBe(
      true
    );
    const stored = await readObjectBody(client, publicBucket, uploaded.objectKey);
    expect(stored.equals(TINY_PNG)).toBe(true);

    const cdn = await fetchPublicUrl(
      getPublicR2Config().baseUrl,
      uploaded.objectKey
    );
    expect(cdn.status).toBe(200);
    expect(cdn.body.equals(TINY_PNG)).toBe(true);
  });

  it("puts private docs, payments, service-references, and video-assets source objects", async () => {
    const client = getR2Client();
    const privateBucket = getPrivateR2Config().bucketName;

    const docKey = buildLessonDocKey(
      ids.course,
      ids.lesson,
      ids.asset,
      `_r2-smoke-${runId}.pdf`
    );
    const paymentKey = buildPaymentProofKey(
      ids.user,
      `_r2-smoke-${runId}.png`
    );
    const referenceKey = buildServiceReferenceKey(
      `guest-r2-smoke-${runId}`,
      `_r2-smoke-${runId}.png`
    );
    const videoKey = buildVideoAssetSourceKey(
      ids.course,
      ids.lesson,
      ids.asset,
      "smoke.mp4"
    );

    expect(docKey).toBe(
      `docs/${ids.course}/${ids.lesson}/${ids.asset}/_r2-smoke-${runId}.pdf`
    );
    expect(videoKey).toBe(
      `video-assets/${ids.course}/${ids.lesson}/${ids.asset}/source/smoke.mp4`
    );

    await putPrivateObject({
      objectKey: docKey,
      body: SMOKE_PDF,
      contentType: "application/pdf",
    });
    await putPrivateObject({
      objectKey: paymentKey,
      body: TINY_PNG,
      contentType: "image/png",
    });
    await putPrivateObject({
      objectKey: referenceKey,
      body: TINY_PNG,
      contentType: "image/png",
    });
    await putPrivateObject({
      objectKey: videoKey,
      body: SMOKE_MP4,
      contentType: "video/mp4",
    });

    created.privateKeys.push(docKey, paymentKey, referenceKey, videoKey);

    for (const key of created.privateKeys) {
      expect(await objectExists(client, privateBucket, key)).toBe(true);
    }

    const storedVideo = await readObjectBody(client, privateBucket, videoKey);
    expect(storedVideo.equals(SMOKE_MP4)).toBe(true);
  });

  it("does not expose private objects on the public CDN origin", async () => {
    expect(created.privateKeys.length).toBeGreaterThan(0);
    const baseUrl = getPublicR2Config().baseUrl;

    for (const key of created.privateKeys) {
      const cdn = await fetchPublicUrl(baseUrl, key);
      expect(isDeniedHttpStatus(cdn.status)).toBe(true);
    }
  });

  it("keeps public and private objects isolated across buckets", async () => {
    const client = getR2Client();
    const publicBucket = getPublicR2Config().bucketName;
    const privateBucket = getPrivateR2Config().bucketName;

    created.isolationPublicKey = `_r2-smoke/${runId}/public-only.txt`;
    created.isolationPrivateKey = `_r2-smoke/${runId}/private-only.txt`;

    await client.send(
      new PutObjectCommand({
        Bucket: publicBucket,
        Key: created.isolationPublicKey,
        Body: Buffer.from(`public isolation ${runId}`),
        ContentType: "text/plain",
      })
    );
    await client.send(
      new PutObjectCommand({
        Bucket: privateBucket,
        Key: created.isolationPrivateKey,
        Body: Buffer.from(`private isolation ${runId}`),
        ContentType: "text/plain",
      })
    );

    expect(
      await objectExists(client, privateBucket, created.isolationPublicKey)
    ).toBe(false);
    expect(
      await objectExists(client, publicBucket, created.isolationPrivateKey)
    ).toBe(false);
    expect(
      await objectExists(client, publicBucket, created.isolationPublicKey)
    ).toBe(true);
    expect(
      await objectExists(client, privateBucket, created.isolationPrivateKey)
    ).toBe(true);
  });
});

describe.skipIf(liveReady)("live R2 dual-bucket contract (skipped)", () => {
  it("skips when public or private R2 env is missing", () => {
    expect(isPrivateR2Configured() && isPublicR2Configured()).toBe(false);
  });
});
