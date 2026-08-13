const ServiceRequest = require("../models/ServiceRequest");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");
const {
  buildGuestServiceReferenceOwner,
  isServiceReferenceObjectKey,
} = require("../lib/r2ObjectKeys");
const { getPrivateObject } = require("../lib/privateR2Storage");
const { isPrivateR2Configured } = require("../lib/r2Config");

function rawReferenceImageUrls(doc) {
  const payload = doc.payload;
  if (!payload || typeof payload !== "object") return [];
  if (!Array.isArray(payload.referenceImageUrls)) return [];
  return payload.referenceImageUrls
    .map((url) => String(url || "").trim())
    .filter(Boolean);
}

function publicReferenceImageUrls(doc) {
  const requestId = doc._id.toString();
  return rawReferenceImageUrls(doc).map((url, index) => {
    if (
      isServiceReferenceObjectKey(url) ||
      String(url).startsWith("service-references/")
    ) {
      return `/api/services/${encodeURIComponent(
        requestId
      )}/reference-images/${index}`;
    }
    return url;
  });
}

function publicService(doc) {
  return {
    _id: doc._id.toString(),
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    type: doc.type,
    status: doc.status,
    message: doc.message,
    details: doc.details,
    notes: doc.notes,
    referenceImageUrls: publicReferenceImageUrls(doc),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function appendLine(lines, label, value) {
  if (value !== undefined && value !== null && String(value).trim() !== "") {
    lines.push(`${label}: ${String(value).trim()}`);
  }
}

function formatDesignDetails(payload) {
  const lines = [];
  appendLine(lines, "Phone", payload.phone);
  appendLine(lines, "Project type", payload.projectType);
  appendLine(lines, "Location", payload.projectLocation);
  appendLine(lines, "Scope of work", payload.scopeOfWork);
  appendLine(lines, "Site size", payload.siteSize);
  appendLine(lines, "Budget range", payload.budgetRange);
  appendLine(lines, "Desired timeline", payload.desiredTimeline);
  if (Array.isArray(payload.referenceImageUrls) && payload.referenceImageUrls.length) {
    lines.push(
      `Reference images: ${payload.referenceImageUrls.length} attached`
    );
  }
  appendLine(lines, "Additional notes", payload.additionalNotes);
  return lines.join("\n");
}

function formatResearchDetails(payload) {
  const lines = [];
  appendLine(lines, "Affiliation", payload.affiliation);
  appendLine(lines, "Interest type", payload.interestType);
  appendLine(lines, "Linked research", payload.linkedResearchTitle || payload.linkedResearchId);
  appendLine(lines, "Research area or topic", payload.researchAreaOrTopic);
  appendLine(lines, "Background / CV link", payload.backgroundCvLink);
  appendLine(lines, "Additional notes", payload.additionalNotes);
  return lines.join("\n");
}

function formatDeviceAccessDetails(payload) {
  const lines = [];
  const kind =
    payload.requestKind === "increase"
      ? "Request extra device slot"
      : payload.requestKind === "replace"
        ? "Replace a registered device"
        : String(payload.requestKind || "Device access");
  appendLine(lines, "Request", kind);
  if (payload.deviceToReplaceLabel || payload.deviceToReplaceId) {
    appendLine(
      lines,
      "Device to replace",
      payload.deviceToReplaceLabel || payload.deviceToReplaceId
    );
  }
  if (payload.deviceToReplaceId && payload.deviceToReplaceLabel) {
    appendLine(lines, "Device id", payload.deviceToReplaceId);
  }
  appendLine(lines, "Reason", payload.reason || payload.additionalNotes);
  return lines.join("\n");
}

function formatSubmissionDetails(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (payload.type === "design") {
    return formatDesignDetails(payload);
  }

  if (payload.type === "research") {
    return formatResearchDetails(payload);
  }

  if (payload.type === "device-access") {
    return formatDeviceAccessDetails(payload);
  }

  return JSON.stringify(payload, null, 2);
}

function normalizeServiceType(payload) {
  if (!payload || typeof payload !== "object") {
    return "general";
  }

  if (payload.type === "device-access") {
    return "device access";
  }

  if (payload.type === "research") {
    if (payload.interestType === "collaborate-existing") {
      return "collaboration";
    }
    return "research participation";
  }

  return String(payload.type || "general");
}

async function create(req, res, next) {
  try {
    validateRequired(req.body, ["name", "email", "type"]);

    const payload = { ...req.body };
    const name = String(payload.name).trim();
    const email = String(payload.email).trim().toLowerCase();
    const type = normalizeServiceType(payload);

    if (payload.type === "device-access") {
      if (!req.auth?.userId) {
        throw createHttpError(
          401,
          "Sign in on a registered device to request a device change from your profile."
        );
      }

      const reason = String(payload.reason || "").trim();
      if (!reason) {
        throw createHttpError(400, "A reason is required for device access requests");
      }

      const requestKind = String(payload.requestKind || "").trim();
      if (requestKind !== "replace" && requestKind !== "increase") {
        throw createHttpError(
          400,
          "Choose whether you want to replace a device or request an extra slot"
        );
      }

      if (requestKind === "replace" && !String(payload.deviceToReplaceId || "").trim()) {
        throw createHttpError(
          400,
          "Select which registered device you want to replace"
        );
      }
    }

    const details = formatSubmissionDetails(payload);

    if (Array.isArray(payload.referenceImageUrls)) {
      const ownerSegment = buildGuestServiceReferenceOwner(name);
      payload.referenceImageUrls = payload.referenceImageUrls
        .map((url) => String(url || "").trim())
        .filter(Boolean);

      for (const url of payload.referenceImageUrls) {
        const isLocal = url.startsWith("/uploads/");
        const isPrivateRef = isServiceReferenceObjectKey(url, ownerSegment);
        if (!isLocal && !isPrivateRef) {
          throw createHttpError(
            400,
            "Reference images must be uploaded under the same name entered on this form"
          );
        }
      }
    }

    const request = await ServiceRequest.create({
      name,
      email,
      type,
      status: "pending",
      details,
      message: details,
      payload,
      userId: req.auth?.userId,
    });

    return sendCreated(res, publicService(request));
  } catch (err) {
    return next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const { status, userId } = req.query;

    if (userId === "me") {
      const filter = {
        $or: [{ userId: req.auth.userId }, { email: req.auth.user.email }],
      };
      const requests = await ServiceRequest.find(filter).sort({ createdAt: -1 });
      return sendSuccess(res, requests.map(publicService));
    }

    if (req.auth.user.role !== "admin") {
      throw createHttpError(403, "Admin access required");
    }

    const filter = status ? { status: String(status) } : {};
    const requests = await ServiceRequest.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, requests.map(publicService));
  } catch (err) {
    return next(err);
  }
}

async function getById(req, res, next) {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      throw createHttpError(404, "Service request not found");
    }

    const isOwner =
      (request.userId &&
        request.userId.toString() === req.auth.userId.toString()) ||
      request.email === req.auth.user.email;

    if (req.auth.user.role !== "admin" && !isOwner) {
      throw createHttpError(403, "Forbidden");
    }

    return sendSuccess(res, publicService(request));
  } catch (err) {
    return next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const request = await ServiceRequest.findById(req.params.id);

    if (!request) {
      throw createHttpError(404, "Service request not found");
    }

    const allowedStatuses = ["pending", "in review", "accepted", "rejected"];
    const nextStatus = req.body.status;

    if (!allowedStatuses.includes(nextStatus)) {
      throw createHttpError(400, "Invalid status");
    }

    request.status = nextStatus;

    if (req.body.notes !== undefined) {
      request.notes = String(req.body.notes).trim();
    }

    await request.save();
    return sendSuccess(res, publicService(request));
  } catch (err) {
    return next(err);
  }
}

async function getReferenceImage(req, res, next) {
  try {
    if (!req.auth) {
      throw createHttpError(401, "Authentication required");
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      throw createHttpError(404, "Service request not found");
    }

    const isOwner =
      (request.userId &&
        request.userId.toString() === req.auth.userId.toString()) ||
      request.email === req.auth.user.email;

    if (req.auth.user.role !== "admin" && !isOwner) {
      throw createHttpError(403, "Forbidden");
    }

    const index = Number(req.params.index);
    const urls = rawReferenceImageUrls(request);
    if (!Number.isInteger(index) || index < 0 || index >= urls.length) {
      throw createHttpError(404, "Reference image not found");
    }

    const objectKey = urls[index];
    if (!isServiceReferenceObjectKey(objectKey)) {
      throw createHttpError(404, "Reference image is not stored in private R2");
    }

    if (!isPrivateR2Configured()) {
      throw createHttpError(503, "Private R2 is not configured");
    }

    const object = await getPrivateObject(objectKey);
    if (!object.Body) {
      throw createHttpError(404, "Reference image not found");
    }

    res.set("Cache-Control", "private, no-store");
    res.set("Vary", "Cookie, Authorization, X-Device-Id");
    res.set("Content-Type", object.ContentType || "image/jpeg");
    res.set("Content-Disposition", "inline");
    if (object.ContentLength) {
      res.set("Content-Length", String(object.ContentLength));
    }

    object.Body.pipe(res);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  getAll,
  getById,
  getReferenceImage,
  updateStatus,
};
