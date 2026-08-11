const SiteSettings = require("../models/SiteSettings");
const {
  branding,
  seo,
  navigation,
  footer,
  pageHeaders,
  contactPage,
  sharedAssetUrls,
  servicesPage,
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
    sharedAssetUrls,
    servicesPage,
  };
}

function serializeSettings(doc) {
  if (!doc) return defaults();

  const plain = typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  const headers = plain.pageHeaders;

  if (headers instanceof Map) {
    plain.pageHeaders = { ...pageHeaders, ...Object.fromEntries(headers.entries()) };
  } else if (!headers || typeof headers !== "object") {
    plain.pageHeaders = { ...pageHeaders };
  } else {
    plain.pageHeaders = { ...pageHeaders, ...headers };
  }

  return plain;
}

function collectHrefs(items = []) {
  const hrefs = [];
  for (const item of items) {
    if (item?.href) hrefs.push(item.href);
    if (item?.children?.length) hrefs.push(...collectHrefs(item.children));
  }
  return hrefs;
}

function insertBeforeContact(items = [], link) {
  const next = [...items];
  const contactIndex = next.findIndex(
    (item) => item.href === "/contact" || item.id === "contact"
  );
  if (contactIndex === -1) {
    next.push(link);
  } else {
    next.splice(contactIndex, 0, link);
  }
  return next;
}

async function ensureSettings() {
  let settings = await SiteSettings.findOne({ key: "default" });
  if (!settings) {
    return SiteSettings.create(defaults());
  }

  const headers = settings.pageHeaders;
  const hasFaqsHeader =
    headers instanceof Map ? headers.has("faqs") : Boolean(headers?.faqs);

  if (!hasFaqsHeader) {
    if (headers instanceof Map) {
      headers.set("faqs", pageHeaders.faqs);
    } else {
      settings.pageHeaders = {
        ...(headers?.toObject?.() ?? headers ?? {}),
        faqs: pageHeaders.faqs,
      };
    }

    const faqLink = { id: "faqs", label: "FAQs", href: "/faqs" };
    const footerLinks = settings.footer?.links ?? [];

    if (!collectHrefs(footerLinks).includes("/faqs")) {
      settings.footer = {
        ...(settings.footer?.toObject?.() ?? settings.footer ?? {}),
        links: insertBeforeContact(footerLinks, faqLink),
      };
      settings.markModified("footer");
    }

    settings.markModified("pageHeaders");
    await settings.save();
  }

  const navItems = settings.navigation?.items ?? [];
  if (collectHrefs(navItems).includes("/faqs")) {
    settings.navigation = {
      ...(settings.navigation?.toObject?.() ?? settings.navigation ?? {}),
      items: navItems.filter(
        (item) => item.href !== "/faqs" && item.id !== "faqs"
      ),
    };
    settings.markModified("navigation");
    await settings.save();
  }

  const footerLinks = settings.footer?.links ?? [];
  if (!collectHrefs(footerLinks).includes("/faqs")) {
    settings.footer = {
      ...(settings.footer?.toObject?.() ?? settings.footer ?? {}),
      links: insertBeforeContact(footerLinks, {
        id: "faqs",
        label: "FAQs",
        href: "/faqs",
      }),
    };
    settings.markModified("footer");
    await settings.save();
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
    if (Array.isArray(payload.sharedAssetUrls)) {
      settings.sharedAssetUrls = payload.sharedAssetUrls
        .map((url) => String(url || "").trim())
        .filter(Boolean);
    }
    if (payload.servicesPage) {
      settings.servicesPage = {
        ...settings.servicesPage?.toObject?.() ?? settings.servicesPage ?? {},
        ...payload.servicesPage,
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
