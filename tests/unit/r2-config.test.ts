import { createRequire } from "node:module";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

const R2_ENV_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_BUCKET_NAME",
  "R2_PUBLIC_BASE_URL",
] as const;

const originalEnv = Object.fromEntries(
  R2_ENV_KEYS.map((key) => [key, process.env[key]])
);

function clearR2Env() {
  for (const key of R2_ENV_KEYS) {
    delete process.env[key];
  }
}

function restoreR2Env() {
  for (const key of R2_ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

const {
  buildPublicAssetUrl,
  getPrivateR2Config,
  getPublicR2Config,
  isPrivateR2Configured,
  isPublicR2Configured,
} = require("../../lib/r2Config.js") as {
  buildPublicAssetUrl: (objectKey: string) => string;
  getPrivateR2Config: () => { bucketName: string; kind: string };
  getPublicR2Config: () => { bucketName: string; baseUrl: string; kind: string };
  isPrivateR2Configured: () => boolean;
  isPublicR2Configured: () => boolean;
};

describe("r2 config", () => {
  beforeEach(() => {
    clearR2Env();
  });

  afterEach(() => {
    restoreR2Env();
  });

  it("treats missing or blank private env as unconfigured", () => {
    expect(isPrivateR2Configured()).toBe(false);
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET_NAME = "   ";
    expect(isPrivateR2Configured()).toBe(false);
    expect(() => getPrivateR2Config()).toThrow(/Missing R2 configuration/);
  });

  it("treats private R2 as configured when the quartet is set", () => {
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET_NAME = "sawy-academy-private";
    expect(isPrivateR2Configured()).toBe(true);
    expect(getPrivateR2Config()).toMatchObject({
      bucketName: "sawy-academy-private",
      kind: "private",
    });
  });

  it("requires public bucket name and base URL in addition to shared creds", () => {
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET_NAME = "sawy-academy-private";
    expect(isPublicR2Configured()).toBe(false);
    expect(() => getPublicR2Config()).toThrow(/Missing public R2 configuration/);

    process.env.R2_PUBLIC_BUCKET_NAME = "sawy-academy-public";
    process.env.R2_PUBLIC_BASE_URL = "https://assets.example.com/";
    expect(isPublicR2Configured()).toBe(true);
  });

  it("builds public CDN URLs without a trailing slash on the origin", () => {
    process.env.R2_ACCOUNT_ID = "acct";
    process.env.R2_ACCESS_KEY_ID = "key";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_PUBLIC_BUCKET_NAME = "sawy-academy-public";
    process.env.R2_PUBLIC_BASE_URL = "https://assets.example.com///";

    expect(
      buildPublicAssetUrl("/website-assets/home/hero.jpg")
    ).toBe("https://assets.example.com/website-assets/home/hero.jpg");
  });
});
