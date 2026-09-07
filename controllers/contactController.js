const ContactInquiry = require("../models/ContactInquiry");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
  validateRequired,
} = require("./controllerUtils");
const mailer = require("../lib/email/mailer");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function create(req, res, next) {
  try {
    validateRequired(req.body, ["name", "email", "subject", "message"]);

    const name = String(req.body.name).trim();
    const email = String(req.body.email).trim().toLowerCase();
    const subject = String(req.body.subject).trim();
    const message = String(req.body.message).trim();

    if (name.length < 2) {
      throw createHttpError(400, "Please provide your full name");
    }

    if (!EMAIL_PATTERN.test(email)) {
      throw createHttpError(400, "Please provide a valid email address");
    }

    if (message.length < 10) {
      throw createHttpError(400, "Please provide a more detailed message");
    }

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";

    const inquiry = await ContactInquiry.create({
      name,
      email,
      subject,
      message,
      status: "pending",
      ipAddress,
      userAgent,
    });

    mailer
      .sendContactInquiryEmail({
        name,
        email,
        subject,
        message,
      })
      .catch(() => {});

    mailer
      .sendContactAcknowledgmentEmail({
        to: email,
        name,
        subject,
      })
      .catch(() => {});

    return sendCreated(res, {
      id: inquiry._id.toString(),
      message: "Message received. We will reply within studio office hours.",
    });
  } catch (err) {
    return next(err);
  }
}

async function getAll(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = String(req.query.status);
    }
    const inquiries = await ContactInquiry.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, inquiries);
  } catch (err) {
    return next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!["pending", "read", "archived"].includes(status)) {
      throw createHttpError(400, "Invalid status");
    }

    const inquiry = await ContactInquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!inquiry) {
      throw createHttpError(404, "Inquiry not found");
    }

    return sendSuccess(res, inquiry);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create,
  getAll,
  updateStatus,
};
