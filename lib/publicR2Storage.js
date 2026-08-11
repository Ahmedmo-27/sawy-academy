const { PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  buildPublicAssetUrl,
  getPublicR2Config,
  getR2Client,
  isPublicR2Configured,
} = require("./r2Config");
const { buildWebsiteAssetKey } = require("./r2ObjectKeys");

const IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function putPublicWebsiteAsset({
  body,
  contentType,
  filename,
  page,
  entityId,
}) {
  if (!isPublicR2Configured()) {
    throw new Error(
      "Public R2 is not configured (R2_PUBLIC_BUCKET_NAME, R2_PUBLIC_BASE_URL)"
    );
  }

  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error(`Unsupported public asset content type: ${contentType}`);
  }

  const objectKey = buildWebsiteAssetKey({ page, entityId, filename });
  const config = getPublicR2Config();

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return {
    objectKey,
    url: buildPublicAssetUrl(objectKey),
    bucket: config.bucketName,
  };
}

module.exports = {
  putPublicWebsiteAsset,
};
