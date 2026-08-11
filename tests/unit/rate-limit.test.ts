import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clientIpFromRequest,
  createMemoryRateLimit,
} from "@/lib/rateLimitNext";

const require = createRequire(import.meta.url);
const {
  createRateLimiter,
  emailKey,
  ipKey,
  serviceCreateKey,
  userKey,
} = require("../../lib/rateLimit.js") as {
  createRateLimiter: (options: {
    max: number;
    windowMs: number;
    keyFn: (req: Record<string, unknown>) => string;
    code?: string;
    message?: string;
    requireKey?: boolean;
  }) => ((
    req: object,
    res: { set: (name: string, value: string) => void },
    next: (error?: Error & { statusCode?: number; code?: string }) => void
  ) => void) & { reset: () => void; max: number };
  emailKey: (req: Record<string, unknown>) => string;
  ipKey: (req: Record<string, unknown>) => string;
  serviceCreateKey: (req: Record<string, unknown>) => string;
  userKey: (req: Record<string, unknown>) => string;
};

function mockRes() {
  return { set: vi.fn() };
}

describe("createRateLimiter", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows up to max requests and 429s the next", () => {
    const limiter = createRateLimiter({
      max: 3,
      windowMs: 60_000,
      keyFn: ipKey,
      code: "RATE_LIMITED",
    });
    const req = { ip: "203.0.113.10" };
    const next = vi.fn();

    for (let index = 0; index < 3; index += 1) {
      limiter(req, mockRes(), next);
    }

    expect(next).toHaveBeenCalledTimes(3);
    expect(next.mock.calls.every(([error]) => error === undefined)).toBe(true);

    limiter(req, mockRes(), next);
    expect(next).toHaveBeenCalledTimes(4);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({
      statusCode: 429,
      code: "RATE_LIMITED",
    });
  });

  it("isolates distinct keys", () => {
    const limiter = createRateLimiter({
      max: 1,
      windowMs: 60_000,
      keyFn: ipKey,
    });
    const next = vi.fn();

    limiter({ ip: "203.0.113.1" }, mockRes(), next);
    limiter({ ip: "203.0.113.2" }, mockRes(), next);
    limiter({ ip: "203.0.113.1" }, mockRes(), next);

    expect(next.mock.calls[0][0]).toBeUndefined();
    expect(next.mock.calls[1][0]).toBeUndefined();
    expect(next.mock.calls[2][0]).toMatchObject({ statusCode: 429 });
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const limiter = createRateLimiter({
      max: 1,
      windowMs: 60_000,
      keyFn: ipKey,
    });
    const req = { ip: "198.51.100.4" };
    const next = vi.fn();

    limiter(req, mockRes(), next);
    limiter(req, mockRes(), next);
    expect(next.mock.calls.at(-1)?.[0]).toMatchObject({ statusCode: 429 });

    vi.advanceTimersByTime(60_000);
    limiter(req, mockRes(), next);
    expect(next.mock.calls.at(-1)?.[0]).toBeUndefined();
  });

  it("returns 401 when requireKey is set and the key is missing", () => {
    const limiter = createRateLimiter({
      max: 5,
      windowMs: 60_000,
      keyFn: userKey,
      requireKey: true,
    });
    const next = vi.fn();

    limiter({ auth: {} }, mockRes(), next);
    expect(next.mock.calls[0][0]).toMatchObject({ statusCode: 401 });
  });

  it("sets rate-limit headers including Retry-After on 429", () => {
    const limiter = createRateLimiter({
      max: 1,
      windowMs: 60_000,
      keyFn: ipKey,
    });
    const req = { ip: "192.0.2.8" };
    const res = mockRes();

    limiter(req, mockRes(), vi.fn());
    limiter(req, res, vi.fn());

    expect(res.set).toHaveBeenCalledWith("RateLimit-Limit", "1");
    expect(res.set).toHaveBeenCalledWith("RateLimit-Remaining", "0");
    expect(res.set).toHaveBeenCalledWith("Retry-After", expect.any(String));
  });
});

describe("rate limit key helpers", () => {
  it("normalizes email keys", () => {
    expect(emailKey({ body: { email: "  Ada@Example.com " } })).toBe(
      "ada@example.com"
    );
    expect(emailKey({ body: {} })).toBe("missing");
  });

  it("prefers user id for service creates when logged in", () => {
    expect(serviceCreateKey({ auth: { userId: "user-1" }, ip: "1.1.1.1" })).toBe(
      "user:user-1"
    );
    expect(serviceCreateKey({ ip: "1.1.1.1" })).toBe("ip:1.1.1.1");
  });
});

describe("Next.js memory rate limit", () => {
  it("uses the first x-forwarded-for hop", () => {
    const request = new Request("http://localhost/api/contact", {
      headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1" },
    });
    expect(clientIpFromRequest(request)).toBe("203.0.113.9");
  });

  it("falls back to unknown without a forwarded header", () => {
    expect(clientIpFromRequest(new Request("http://localhost/api/contact"))).toBe(
      "unknown"
    );
  });

  it("limits after max requests for a key", () => {
    const limiter = createMemoryRateLimit({ max: 3, windowMs: 10 * 60_000 });

    expect(limiter.consume("203.0.113.1").limited).toBe(false);
    expect(limiter.consume("203.0.113.1").limited).toBe(false);
    expect(limiter.consume("203.0.113.1").limited).toBe(false);
    expect(limiter.consume("203.0.113.1")).toMatchObject({
      limited: true,
      remaining: 0,
    });
    expect(limiter.consume("203.0.113.2").limited).toBe(false);
  });
});
