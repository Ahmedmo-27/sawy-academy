/**
 * R2 object key builders for the two-bucket layout.
 * @see docs/r2-storage-layout.md
 */

const path = require("path");

const WEBSITE_ASSET_PAGES = Object.freeze([
  "home",
  "courses",
  "services",
  "portfolio",
  "products",
  "researches",
  "branding",
  "shared",
  "contact",
]);

function safeKeySegment(value, fallback) {
  const segment = String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return segment || fallback;
}

function safeFilename(filename, defaultBasename, defaultExt) {
  const parsed = path.parse(String(filename || `${defaultBasename}${defaultExt}`));
  const basename = safeKeySegment(parsed.name, defaultBasename).slice(0, 120);
  const extension = parsed.ext.toLowerCase().replace(/[^.a-z0-9]/g, "");
  return `${basename}${extension || defaultExt}`;
}

function normalizeWebsitePage(page) {
  const normalized = String(page || "shared")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!WEBSITE_ASSET_PAGES.includes(normalized)) {
    throw new Error(
      `Invalid website-assets page "${page}". Allowed: ${WEBSITE_ASSET_PAGES.join(", ")}`
    );
  }
  return normalized;
}

/**
 * Public bucket key:
 * website-assets/{page}/[{entityId}/]{timestamp}-{random}-{safeFilename}
 */
function buildWebsiteAssetKey({ page, entityId, filename } = {}) {
  const pageSegment = normalizeWebsitePage(page);
  const uniqueName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${safeFilename(filename, "asset", ".jpg")}`;

  const parts = ["website-assets", pageSegment];
  if (entityId != null && String(entityId).trim() !== "") {
    parts.push(safeKeySegment(entityId, "entity"));
  }
  parts.push(uniqueName);
  return parts.join("/");
}

/**
 * Private bucket key:
 * docs/{courseObjectId}/{lessonObjectId}/{assetId}/{safeFilename}.pdf
 */
function buildLessonDocKey(courseId, lessonId, assetId, filename) {
  return [
    "docs",
    safeKeySegment(courseId, "course"),
    safeKeySegment(lessonId, "lesson"),
    safeKeySegment(assetId, "asset"),
    safeFilename(filename, "lesson-doc", ".pdf"),
  ].join("/");
}

/**
 * Private bucket key (checkout proofs):
 * payments/{userObjectId}/{timestamp}-{random}-{safeFilename}
 */
function buildPaymentProofKey(userId, filename) {
  const uniqueName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${safeFilename(filename, "payment", ".jpg")}`;
  return ["payments", safeKeySegment(userId, "user"), uniqueName].join("/");
}

function isPaymentProofObjectKey(objectKey, userId) {
  const key = String(objectKey || "");
  if (!key.startsWith("payments/") || key.includes("..")) {
    return false;
  }
  if (userId == null || String(userId).trim() === "") {
    return /^payments\/[^/]+\/[^/]+$/.test(key);
  }
  const prefix = `payments/${safeKeySegment(userId, "user")}/`;
  return key.startsWith(prefix) && !key.slice(prefix.length).includes("/");
}

/**
 * Private owner folder for guest service references:
 * guest-{safeName} (name from the design request form).
 */
function buildGuestServiceReferenceOwner(name) {
  const safe = safeKeySegment(name, "guest");
  const withPrefix = safe.toLowerCase().startsWith("guest-")
    ? safe
    : `guest-${safe}`;
  return safeKeySegment(withPrefix, "guest-anonymous");
}

/**
 * Private bucket key (service form reference images):
 * service-references/{ownerSegment}/{timestamp}-{random}-{safeFilename}
 * Guests use ownerSegment = guest-{name} from the design request.
 */
function buildServiceReferenceKey(ownerSegment, filename) {
  const uniqueName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}-${safeFilename(filename, "reference", ".jpg")}`;
  return [
    "service-references",
    safeKeySegment(ownerSegment, "guest-anonymous"),
    uniqueName,
  ].join("/");
}

function isServiceReferenceObjectKey(objectKey, ownerSegment) {
  const key = String(objectKey || "");
  if (!key.startsWith("service-references/") || key.includes("..")) {
    return false;
  }
  if (ownerSegment == null || String(ownerSegment).trim() === "") {
    return /^service-references\/[^/]+\/[^/]+$/.test(key);
  }
  const prefix = `service-references/${safeKeySegment(
    ownerSegment,
    "guest-anonymous"
  )}/`;
  return key.startsWith(prefix) && !key.slice(prefix.length).includes("/");
}

module.exports = {
  WEBSITE_ASSET_PAGES,
  buildGuestServiceReferenceOwner,
  buildLessonDocKey,
  buildPaymentProofKey,
  buildServiceReferenceKey,
  buildWebsiteAssetKey,
  isPaymentProofObjectKey,
  isServiceReferenceObjectKey,
  normalizeWebsitePage,
  safeFilename,
  safeKeySegment,
};
