import { createRequire } from "node:module";
import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

const require = createRequire(import.meta.url);
const mongoose = require("mongoose");
const User = require("../../models/User.js");
const PasswordResetToken = require("../../models/PasswordResetToken.js");
const Session = require("../../models/Session.js");
const mailer = require("../../lib/email/mailer.js");
const authController = require("../../controllers/authController.js");

function createMockRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("Password Reset Workflow", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a password reset email if user exists", async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const mockUser = {
      _id: userId,
      email: "student@sawy.eg",
      name: "Ahmed",
    };

    vi.spyOn(User, "findOne").mockResolvedValue(mockUser);
    vi.spyOn(PasswordResetToken, "deleteMany").mockResolvedValue({ deletedCount: 1 });
    vi.spyOn(PasswordResetToken, "create").mockImplementation(async (doc: any) => doc);
    vi.spyOn(mailer, "sendPasswordResetEmail").mockResolvedValue({ success: true });

    const req: any = {
      body: { email: "STUDENT@sawy.eg" },
      headers: { origin: "https://sawyacademy.eg" },
    };
    const res = createMockRes();
    const next = vi.fn();

    await authController.forgotPassword(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: "student@sawy.eg" });
    expect(PasswordResetToken.deleteMany).toHaveBeenCalledWith({ userId });
    expect(PasswordResetToken.create).toHaveBeenCalled();
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "student@sawy.eg",
        name: "Ahmed",
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  it("returns generic success if user does not exist (anti-enumeration)", async () => {
    vi.spyOn(User, "findOne").mockResolvedValue(null);
    vi.spyOn(PasswordResetToken, "create").mockImplementation(async (doc: any) => doc);
    vi.spyOn(mailer, "sendPasswordResetEmail").mockResolvedValue({ success: true });

    const req: any = {
      body: { email: "nonexistent@sawy.eg" },
      headers: { origin: "https://sawyacademy.eg" },
    };
    const res = createMockRes();
    const next = vi.fn();

    await authController.forgotPassword(req, res, next);

    expect(PasswordResetToken.create).not.toHaveBeenCalled();
    expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  it("verifies a valid token successfully", async () => {
    const rawToken = "my-secret-reset-token-123";
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    vi.spyOn(PasswordResetToken, "findOne").mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        tokenHash,
        userId: { email: "student@sawy.eg", name: "Ahmed" },
        expiresAt: new Date(Date.now() + 100000),
      }),
    } as any);

    const req: any = { params: { token: rawToken } };
    const res = createMockRes();
    const next = vi.fn();

    await authController.verifyResetToken(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        valid: true,
        email: "student@sawy.eg",
      },
    });
  });

  it("resets the password, clears reset tokens, and invalidates old sessions", async () => {
    const rawToken = "valid-token-xyz";
    const userId = new mongoose.Types.ObjectId().toString();
    const mockUser: any = {
      _id: userId,
      email: "student@sawy.eg",
      passwordHash: "old-hash",
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(PasswordResetToken, "findOne").mockResolvedValue({
      userId,
      expiresAt: new Date(Date.now() + 100000),
    });
    vi.spyOn(User, "findById").mockResolvedValue(mockUser);
    vi.spyOn(PasswordResetToken, "deleteMany").mockResolvedValue({ deletedCount: 1 });
    vi.spyOn(Session, "deleteMany").mockResolvedValue({ deletedCount: 2 });

    const req: any = {
      body: { token: rawToken, password: "newPassword123" },
    };
    const res = createMockRes();
    const next = vi.fn();

    await authController.resetPassword(req, res, next);

    expect(mockUser.passwordHash).not.toBe("old-hash");
    expect(mockUser.save).toHaveBeenCalled();
    expect(PasswordResetToken.deleteMany).toHaveBeenCalledWith({ userId });
    expect(Session.deleteMany).toHaveBeenCalledWith({ userId });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });
});
