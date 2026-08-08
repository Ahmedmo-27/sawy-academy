const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream/promises");
const {
  CopyObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const { getR2Client, getR2Config } = require("./videoAccess");

const CONTENT_TYPES = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
};

function contentTypeFor(filename) {
  return CONTENT_TYPES[path.extname(filename).toLowerCase()] ||
    "application/octet-stream";
}

async function downloadObject(objectKey, destination) {
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2Config().bucketName,
      Key: objectKey,
    })
  );
  if (!response.Body) {
    throw new Error(`R2 object has no body: ${objectKey}`);
  }
  await pipeline(response.Body, fs.createWriteStream(destination));
}

async function listLocalFiles(root, current = root) {
  const entries = await fs.promises.readdir(current, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(current, entry.name);
      return entry.isDirectory() ? listLocalFiles(root, absolute) : [absolute];
    })
  );
  return nested.flat();
}

async function uploadFile(objectKey, filename) {
  const stat = await fs.promises.stat(filename);
  const uploader = new Upload({
    client: getR2Client(),
    params: {
      Bucket: getR2Config().bucketName,
      Key: objectKey,
      Body: fs.createReadStream(filename),
      ContentLength: stat.size,
      ContentType: contentTypeFor(filename),
      CacheControl: "private, no-store",
    },
  });
  await uploader.done();
}

async function uploadDirectory(root, prefix) {
  const files = await listLocalFiles(root);
  let nextIndex = 0;
  const configuredConcurrency = Number(
    process.env.VIDEO_R2_UPLOAD_CONCURRENCY
  );
  const requestedConcurrency =
    Number.isFinite(configuredConcurrency) && configuredConcurrency > 0
      ? Math.floor(configuredConcurrency)
      : 8;
  const concurrency = Math.min(
    files.length,
    requestedConcurrency
  );
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (nextIndex < files.length) {
        const filename = files[nextIndex];
        nextIndex += 1;
        const relative = path.relative(root, filename).split(path.sep).join("/");
        await uploadFile(`${prefix}${relative}`, filename);
      }
    })
  );
  return files.map((filename) =>
    path.relative(root, filename).split(path.sep).join("/")
  );
}

function copySource(bucket, objectKey) {
  return `${encodeURIComponent(bucket)}/${objectKey
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

async function publishStagedFiles(
  stagingPrefix,
  outputPrefix,
  relativeFiles,
  options = {}
) {
  const bucket = getR2Config().bucketName;
  const ordered = [...relativeFiles].sort((left, right) => {
    if (left === "master.m3u8") return 1;
    if (right === "master.m3u8") return -1;
    return left.localeCompare(right);
  });

  for (const relative of ordered) {
    if (options.shouldContinue && !options.shouldContinue()) {
      const error = new Error("Video processing lease was lost during publish");
      error.code = "LEASE_LOST";
      throw error;
    }
    await getR2Client().send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: copySource(bucket, `${stagingPrefix}${relative}`),
        Key: `${outputPrefix}${relative}`,
        ContentType: contentTypeFor(relative),
        CacheControl: "private, no-store",
        MetadataDirective: "REPLACE",
      })
    );
  }
}

async function deletePrefix(prefix) {
  if (!prefix) return;
  const client = getR2Client();
  const bucket = getR2Config().bucketName;
  let continuationToken;

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    const objects = (listed.Contents || [])
      .filter((object) => object.Key)
      .map((object) => ({ Key: object.Key }));

    if (objects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects, Quiet: true },
        })
      );
    }
    continuationToken = listed.IsTruncated
      ? listed.NextContinuationToken
      : undefined;
  } while (continuationToken);
}

async function putBuffer(objectKey, body, options = {}) {
  return getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Config().bucketName,
      Key: objectKey,
      Body: body,
      ContentLength: body.length,
      ContentType: options.contentType || "application/octet-stream",
      ContentDisposition: options.contentDisposition,
      Metadata: options.metadata,
    })
  );
}

module.exports = {
  deletePrefix,
  downloadObject,
  publishStagedFiles,
  putBuffer,
  uploadDirectory,
};
