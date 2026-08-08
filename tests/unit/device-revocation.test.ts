import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const Device = require("../../models/Device.js");
const Session = require("../../models/Session.js");
const {
  createSession,
  deleteSession,
  removeDevice,
  verifyDeviceRegistered,
} = require("../../lib/deviceAuth.js") as {
  createSession: (
    token: string,
    userId: string,
    deviceId: string
  ) => Promise<void>;
  deleteSession: (token: string) => Promise<void>;
  removeDevice: (userId: string, deviceId: string) => Promise<void>;
  verifyDeviceRegistered: (
    userId: string,
    deviceId: string
  ) => Promise<unknown>;
};
const {
  requireDevice,
} = require("../../middleware/authMiddleware.js") as {
  requireDevice: (
    request: Record<string, unknown>,
    response: Record<string, unknown>,
    next: (error?: Error) => void
  ) => Promise<void>;
};

describe("session and device revocation helpers", () => {
  it("atomically replaces prior sessions for the same device before creation", async () => {
    const deleteMany = vi.spyOn(Session, "deleteMany").mockResolvedValue({});
    const create = vi.spyOn(Session, "create").mockResolvedValue({});

    await createSession("new-token", "user", "device-one");

    expect(deleteMany).toHaveBeenCalledWith({
      userId: "user",
      deviceId: "device-one",
    });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        token: "new-token",
        userId: "user",
        deviceId: "device-one",
        expiresAt: expect.any(Date),
      })
    );
    expect(deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
      create.mock.invocationCallOrder[0]
    );
  });

  it("revokes one token on logout and all sessions when a device is removed", async () => {
    const deleteOneSession = vi
      .spyOn(Session, "deleteOne")
      .mockResolvedValue({});
    const deleteOneDevice = vi
      .spyOn(Device, "deleteOne")
      .mockResolvedValue({});
    const deleteManySessions = vi
      .spyOn(Session, "deleteMany")
      .mockResolvedValue({});

    await deleteSession("token");
    await removeDevice("user", "device-one");

    expect(deleteOneSession).toHaveBeenCalledWith({ token: "token" });
    expect(deleteOneDevice).toHaveBeenCalledWith({
      userId: "user",
      deviceId: "device-one",
    });
    expect(deleteManySessions).toHaveBeenCalledWith({
      userId: "user",
      deviceId: "device-one",
    });
  });

  it("returns the explicit revocation error for a removed device", async () => {
    vi.spyOn(Device, "findOne").mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    });
    await expect(
      verifyDeviceRegistered("user", "removed-device")
    ).rejects.toMatchObject({ statusCode: 401, code: "DEVICE_REMOVED" });
  });

  it("rejects a registered-device header that differs from the session device", async () => {
    const next = vi.fn();
    await requireDevice(
      {
        auth: {
          userId: "user",
          deviceId: "session-device",
        },
        headers: { "x-device-id": "different-device" },
      },
      {},
      next
    );

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: "DEVICE_MISMATCH" })
    );
  });
});
