const { GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  getPrivateR2Config,
  getR2Client,
  isPrivateR2Configured,
} = require("./r2Config");
const { buildPaymentProofKey, buildServiceReferenceKey } = require("./r2ObjectKeys");

const IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function putPrivateObject({
  objectKey,
  body,
  contentType,
  cacheControl = "private, no-store",
  contentDisposition,
}) {
  if (!isPrivateR2Configured()) {
    throw new Error(
      "Private R2 is not configured (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME)"
    );
  }

  const config = getPrivateR2Config();
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
      CacheControl: cacheControl,
      ...(contentDisposition
        ? { ContentDisposition: contentDisposition }
        : {}),
    })
  );

  return {
    objectKey,
    bucket: config.bucketName,
  };
}

async function putPrivateImageUnderUserPrefix({
  buildKey,
  userId,
  body,
  contentType,
  filename,
  label,
}) {
  if (!IMAGE_CONTENT_TYPES.has(contentType)) {
    throw new Error(`Unsupported ${label} content type: ${contentType}`);
  }

  const objectKey = buildKey(userId, filename);
  await putPrivateObject({
    objectKey,
    body,
    contentType,
    contentDisposition: "inline",
  });

  return { objectKey, bucket: getPrivateR2Config().bucketName };
}

async function putPrivatePaymentProof(options) {
  return putPrivateImageUnderUserPrefix({
    ...options,
    buildKey: buildPaymentProofKey,
    label: "payment proof",
  });
}

async function putPrivateServiceReference({
  ownerSegment,
  body,
  contentType,
  filename,
}) {
  return putPrivateImageUnderUserPrefix({
    userId: ownerSegment,
    body,
    contentType,
    filename,
    buildKey: buildServiceReferenceKey,
    label: "service reference",
  });
}

async function getPrivateObject(objectKey) {
  if (!isPrivateR2Configured()) {
    throw new Error("Private R2 is not configured");
  }

  const config = getPrivateR2Config();
  return getR2Client().send(
    new GetObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
    })
  );
}

module.exports = {
  getPrivateObject,
  putPrivateObject,
  putPrivatePaymentProof,
  putPrivateServiceReference,
};
