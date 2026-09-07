import { createRequire } from "node:module";
import { describe, it, expect, vi, beforeEach } from "vitest";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const ContactInquiry = require("../../models/ContactInquiry.js");
const mailer = require("../../lib/email/mailer.js");
const contactController = require("../../controllers/contactController.js");

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("Contact Form Persistence & Email", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("validates and saves inquiry to MongoDB and triggers emails", async () => {
    const inquiryId = new mongoose.Types.ObjectId().toString();
    vi.spyOn(ContactInquiry, "create").mockImplementation(async (doc: any) => ({
      _id: inquiryId,
      ...doc,
    }));
    vi.spyOn(mailer, "sendContactInquiryEmail").mockResolvedValue({ success: true });
    vi.spyOn(mailer, "sendContactAcknowledgmentEmail").mockResolvedValue({ success: true });

    const req: any = {
      body: {
        name: "Youssef Hassan",
        email: "youssef@example.com",
        subject: "Design Consultation",
        message: "We would like to discuss an architectural commission in Cairo.",
      },
      headers: {
        "x-forwarded-for": "197.35.120.4",
        "user-agent": "Mozilla/5.0 Test",
      },
      socket: { remoteAddress: "127.0.0.1" },
    };
    const res = createMockRes();
    const next = vi.fn();

    await contactController.create(req, res, next);

    expect(ContactInquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Youssef Hassan",
        email: "youssef@example.com",
        subject: "Design Consultation",
        status: "pending",
        ipAddress: "197.35.120.4",
      })
    );
    expect(mailer.sendContactInquiryEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Youssef Hassan",
        email: "youssef@example.com",
        subject: "Design Consultation",
      })
    );
    expect(mailer.sendContactAcknowledgmentEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "youssef@example.com",
        name: "Youssef Hassan",
        subject: "Design Consultation",
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("rejects invalid input with 400", async () => {
    vi.spyOn(ContactInquiry, "create").mockImplementation(async (doc: any) => doc);

    const req: any = {
      body: {
        name: "Y",
        email: "not-an-email",
        subject: "General",
        message: "short",
      },
      headers: {},
    };
    const res = createMockRes();
    const next = vi.fn();

    await contactController.create(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
      })
    );
    expect(ContactInquiry.create).not.toHaveBeenCalled();
  });
});
