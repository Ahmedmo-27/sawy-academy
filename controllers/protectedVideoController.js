const path = require("path");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { authorizeLessonVideo } = require("../lib/lessonVideoAccessPolicy");
const {
  normalizeMediaPath,
  signMediaGrant,
  verifyMediaGrant,
} = require("../lib/mediaGrant");
const { unwrapContentKey } = require("../lib/videoEncryption");
const { getR2Client, getR2Config } = require("../lib/videoAccess");
const {
  completeHlsKeyAudit,
  setHlsKeyAuditContext,
} = require("../lib/videoAccessAudit");
const { createHttpError } = require("./controllerUtils");
const logger = require("../utils/logger");

const MAX_MANIFEST_BYTES = 1024 * 1024;

function canonicalOutputPrefix(course, lesson, asset) {
  return `video-assets/${course._id}/${lesson._id}/${asset._id}/hls/`;
}

function assertCanonicalAssetLocation(course, lesson, asset) {
  const expectedPrefix = canonicalOutputPrefix(course, lesson, asset);
  if (
    asset.outputPrefix !== expectedPrefix ||
    asset.masterPlaylistObjectKey !== `${expectedPrefix}master.m3u8`
  ) {
    throw createHttpError(500, "Protected video location is invalid");
  }
  return expectedPrefix;
}

async function readManifest(objectKey) {
  const response = await getR2Client().send(
    new GetObjectCommand({
      Bucket: getR2Config().bucketName,
      Key: objectKey,
    })
  );
  if (!response.Body || Number(response.ContentLength) > MAX_MANIFEST_BYTES) {
    throw createHttpError(502, "Video manifest is unavailable");
  }

  const chunks = [];
  let bytes = 0;
  for await (const chunk of response.Body) {
    const buffer = Buffer.from(chunk);
    bytes += buffer.length;
    if (bytes > MAX_MANIFEST_BYTES) {
      throw createHttpError(502, "Video manifest is too large");
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function resolveRelativePath(basePath, uri, extensionPattern) {
  const value = String(uri || "").trim();
  if (
    !value ||
    value.includes("\\") ||
    value.includes("\0") ||
    /^[a-z][a-z0-9+.-]*:/i.test(value) ||
    value.startsWith("/") ||
    value.includes("?") ||
    value.includes("#")
  ) {
    throw createHttpError(502, "Video manifest contains an invalid URI");
  }
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    throw createHttpError(502, "Video manifest contains an invalid URI");
  }
  if (decoded !== value) {
    throw createHttpError(502, "Video manifest contains an encoded URI");
  }
  if (value.split("/").some((segment) => segment === "." || segment === "..")) {
    throw createHttpError(502, "Video manifest contains a traversal URI");
  }
  const resolved = path.posix.normalize(
    path.posix.join(path.posix.dirname(basePath), value)
  );
  if (
    resolved.startsWith("../") ||
    resolved.includes("/../") ||
    !extensionPattern.test(resolved)
  ) {
    throw createHttpError(502, "Video manifest contains an unsafe URI");
  }
  return resolved;
}

function grantClaims(req, course, lesson, asset) {
  return {
    uid: String(req.auth.userId),
    sid: String(req.auth.sessionId),
    did: String(req.auth.deviceId),
    cid: String(course._id),
    lid: String(lesson._id),
    aid: String(asset._id),
    gen: asset.generation,
  };
}

function grantMatchesExpected(claims, expected, scope) {
  return (
    claims.scope === scope &&
    claims.uid === expected.uid &&
    claims.sid === expected.sid &&
    claims.did === expected.did &&
    claims.cid === expected.cid &&
    claims.lid === expected.lid &&
    claims.aid === expected.aid &&
    claims.gen === expected.gen
  );
}

function manifestEndpoint(lessonId, variant) {
  const base = `/api/lessons/${encodeURIComponent(lessonId)}/manifest`;
  return variant ? `${base}?variant=${encodeURIComponent(variant)}` : base;
}

function rewriteMaster(manifest, lesson, asset) {
  const allowedVariants = new Set(
    asset.renditions.map((rendition) => {
      const prefix = asset.outputPrefix;
      if (!rendition.playlistObjectKey.startsWith(prefix)) {
        throw createHttpError(500, "Protected rendition location is invalid");
      }
      return rendition.playlistObjectKey.slice(prefix.length);
    })
  );
  return manifest
    .split(/\r?\n/)
    .map((line) => {
      if (!line || line.startsWith("#")) return line;
      const variant = resolveRelativePath("master.m3u8", line, /\.m3u8$/i);
      if (!allowedVariants.has(variant)) {
        throw createHttpError(502, "Video manifest references an unknown rendition");
      }
      return manifestEndpoint(String(lesson._id), variant);
    })
    .join("\n");
}

function rewriteVariant(manifest, req, course, lesson, asset, variant) {
  const baseClaims = grantClaims(req, course, lesson, asset);
  const mediaBaseUrl = String(process.env.VIDEO_MEDIA_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  if (!/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?$/.test(mediaBaseUrl)) {
    throw createHttpError(500, "VIDEO_MEDIA_BASE_URL must be an HTTPS origin");
  }
  const keyGrant = signMediaGrant({ ...baseClaims, scope: "key" });
  const keyUri = `/api/lessons/${encodeURIComponent(
    String(lesson._id)
  )}/hls-key?grant=${encodeURIComponent(keyGrant)}`;
  const mediaUri = (uri) => {
    const mediaPath = normalizeMediaPath(
      resolveRelativePath(variant, uri, /\.(?:ts|m4s|mp4|aac)$/i)
    );
    const grant = signMediaGrant({
      ...baseClaims,
      scope: "media",
      path: mediaPath,
    });
    return `${mediaBaseUrl}/media?grant=${encodeURIComponent(grant)}`;
  };

  return manifest
    .split(/\r?\n/)
    .map((line) => {
      if (!line) return line;
      if (line.startsWith("#EXT-X-KEY:")) {
        if (!/METHOD=AES-128(?:,|$)/.test(line) || !/URI="[^"]+"/.test(line)) {
          throw createHttpError(502, "Video manifest has invalid encryption");
        }
        return line.replace(/URI="[^"]+"/, `URI="${keyUri}"`);
      }
      if (line.startsWith("#EXT-X-MAP:")) {
        const match = line.match(/URI="([^"]+)"/);
        if (!match) {
          throw createHttpError(502, "Video manifest has an invalid media map");
        }
        return line.replace(/URI="[^"]+"/, `URI="${mediaUri(match[1])}"`);
      }
      if (line.startsWith("#")) return line;
      return mediaUri(line);
    })
    .join("\n");
}

function configuredAllowedOrigins() {
  return String(
    process.env.VIDEO_ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS || ""
  )
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function requestSourceOrigin(req) {
  const origin = req.get("Origin");
  if (origin) return origin.replace(/\/+$/, "");
  const referer = req.get("Referer");
  if (!referer) return "";
  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

function assertAllowedSource(req) {
  const source = requestSourceOrigin(req);
  if (!source || !configuredAllowedOrigins().includes(source)) {
    throw createHttpError(403, "Video key request origin is not allowed", {
      code: "VIDEO_ORIGIN_DENIED",
    });
  }
}

async function getManifest(req, res, next) {
  try {
    const { lesson, course, asset } = await authorizeLessonVideo(
      req.auth,
      req.params.lessonId,
      { requireReadyAsset: true }
    );
    const prefix = assertCanonicalAssetLocation(course, lesson, asset);
    const requestedVariant = req.query.variant
      ? String(req.query.variant).trim()
      : "";
    let variantPath = "";
    let objectKey = asset.masterPlaylistObjectKey;
    if (requestedVariant) {
      variantPath = resolveRelativePath(
        "master.m3u8",
        requestedVariant,
        /\.m3u8$/i
      );
      const rendition = asset.renditions.find(
        (item) => item.playlistObjectKey === `${prefix}${variantPath}`
      );
      if (!rendition) throw createHttpError(404, "Video rendition not found");
      objectKey = rendition.playlistObjectKey;
    }

    const manifest = await readManifest(objectKey);
    const rewritten = requestedVariant
      ? rewriteVariant(
          manifest,
          req,
          course,
          lesson,
          asset,
          variantPath
        )
      : rewriteMaster(manifest, lesson, asset);
    res.set({
      "Cache-Control": "private, no-store",
      "Content-Type": "application/vnd.apple.mpegurl",
      Vary: "Cookie, Authorization, X-Device-Id",
    });
    return res.status(200).send(rewritten);
  } catch (error) {
    return next(error);
  }
}

async function getHlsKey(req, res, next) {
  let failureReason = "policy_denied";
  try {
    failureReason = "origin_denied";
    assertAllowedSource(req);
    failureReason = "policy_denied";
    const { lesson, course, asset } = await authorizeLessonVideo(
      req.auth,
      req.params.lessonId,
      { requireReadyAsset: true }
    );
    setHlsKeyAuditContext(req, {
      lessonId: lesson._id,
      assetId: asset._id,
    });
    failureReason = "asset_location_invalid";
    assertCanonicalAssetLocation(course, lesson, asset);
    let claims;
    failureReason = "grant_invalid";
    try {
      claims = verifyMediaGrant(req.query.grant);
    } catch {
      throw createHttpError(403, "Invalid video key grant", {
        code: "VIDEO_KEY_GRANT_INVALID",
      });
    }
    const expected = grantClaims(req, course, lesson, asset);
    if (!grantMatchesExpected(claims, expected, "key")) {
      throw createHttpError(403, "Invalid video key grant", {
        code: "VIDEO_KEY_GRANT_MISMATCH",
      });
    }

    failureReason = "key_unwrap_failed";
    const contentKey = unwrapContentKey(asset.encryption);
    if (contentKey.length !== 16) {
      throw createHttpError(500, "Protected video key is invalid", {
        code: "VIDEO_CONTENT_KEY_INVALID",
      });
    }
    await completeHlsKeyAudit(req, {
      outcome: "success",
      reason: "key_delivered",
      lessonId: lesson._id,
      assetId: asset._id,
      detectAnomaly: true,
    });
    res.set({
      "Cache-Control": "private, no-store",
      "Content-Length": "16",
      "Content-Type": "application/octet-stream",
      Vary: "Cookie, Authorization, X-Device-Id, Origin, Referer",
    });
    let keyCleared = false;
    const clearContentKey = () => {
      if (keyCleared) return;
      keyCleared = true;
      contentKey.fill(0);
    };
    res.once("finish", clearContentKey);
    res.once("close", clearContentKey);
    return res.status(200).send(contentKey);
  } catch (error) {
    try {
      await completeHlsKeyAudit(req, {
        outcome: Number(error.statusCode) >= 500 ? "error" : "denied",
        reason: error.code || failureReason,
      });
    } catch (auditError) {
      logger.error("Failed to persist denied HLS key audit", {
        error: auditError,
        reason: failureReason,
      });
    }
    return next(error);
  }
}

module.exports = {
  assertAllowedSource,
  assertCanonicalAssetLocation,
  configuredAllowedOrigins,
  getHlsKey,
  getManifest,
  grantMatchesExpected,
  requestSourceOrigin,
  resolveRelativePath,
  rewriteMaster,
  rewriteVariant,
};
