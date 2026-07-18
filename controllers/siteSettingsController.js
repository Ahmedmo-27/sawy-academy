const SiteSettings = require("../models/SiteSettings");
const {
  branding,
  seo,
  navigation,
  footer,
  pageHeaders,
  contactPage,
} = require("../seeders/data/siteDefaults");
const { createHttpError, sendSuccess } = require("./controllerUtils");

function defaults() {
  return {
    key: "default",
    branding,
    seo,
    navigation,
    footer,
    pageHeaders,
    contactPage,
  };
}

function serializeSettings(doc) {
  if (!doc) return defaults();

  const plain = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const headers = plain.pageHeaders;

  if (headers instanceof Map) {
    plain.pageHeaders = Object.fromEntries(headers.entries());
  } else if (!headers || typeof headers !== "object") {
    plain.pageHeaders = { ...pageHeaders };
  }

  return plain;
}

async function ensureSettings() {
  let settings = await SiteSettings.findOne({ key: "default" });
  if (!settings) {
    settings = await SiteSettings.create(defaults());
  }
  return settings;
}

async function get(req, res, next) {
  try {
    const settings = await ensureSettings();
    return sendSuccess(res, serializeSettings(settings));
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const payload = req.body || {};
    const settings = await ensureSettings();

    if (payload.branding) {
      settings.branding = { ...settings.branding?.toObject?.() ?? settings.branding, ...payload.branding };
      if (payload.branding.address) {
        settings.branding.address = {
          ...(settings.branding.address?.toObject?.() ?? settings.branding.address ?? {}),
          ...payload.branding.address,
        };
      }
    }
    if (payload.seo) {
      settings.seo = { ...settings.seo?.toObject?.() ?? settings.seo, ...payload.seo };
    }
    if (payload.navigation) {
      settings.navigation = payload.navigation;
    }
    if (payload.footer) {
      settings.footer = payload.footer;
    }
    if (payload.pageHeaders) {
      settings.pageHeaders = payload.pageHeaders;
    }
    if (payload.contactPage) {
      settings.contactPage = {
        ...settings.contactPage?.toObject?.() ?? settings.contactPage,
        ...payload.contactPage,
      };
    }

    await settings.save();
    return sendSuccess(res, serializeSettings(settings));
  } catch (err) {
    return next(err);
  }
}

async function reset(req, res, next) {
  try {
    await SiteSettings.findOneAndDelete({ key: "default" });
    const settings = await SiteSettings.create(defaults());
    return sendSuccess(res, serializeSettings(settings));
  } catch (err) {
    return next(err);
  }
}

module.exports = { get, update, reset, ensureSettings, serializeSettings, defaults };
