const HomePage = require("../models/HomePage");
const { homeSections } = require("../seeders/data/siteDefaults");
const {
  createHttpError,
  sendCreated,
  sendSuccess,
} = require("./controllerUtils");

function defaults() {
  return {
    key: "home",
    sections: homeSections.map((section) => ({ ...section, content: { ...section.content } })),
  };
}

function sortSections(sections) {
  return [...sections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

async function ensureHomePage() {
  let page = await HomePage.findOne({ key: "home" });
  if (!page) {
    page = await HomePage.create(defaults());
  }
  return page;
}

function serialize(page) {
  const plain = typeof page.toObject === "function" ? page.toObject() : { ...page };
  plain.sections = sortSections(plain.sections || []);
  return plain;
}

async function get(req, res, next) {
  try {
    const page = await ensureHomePage();
    return sendSuccess(res, serialize(page));
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const { sections } = req.body || {};
    if (!Array.isArray(sections)) {
      throw createHttpError(400, "sections must be an array");
    }

    const page = await ensureHomePage();
    page.sections = sections.map((section, index) => ({
      id: section.id || `section-${index + 1}`,
      type: section.type,
      enabled: section.enabled !== false,
      order: section.order ?? index + 1,
      content: section.content || {},
    }));
    await page.save();
    return sendSuccess(res, serialize(page));
  } catch (err) {
    return next(err);
  }
}

async function reorder(req, res, next) {
  try {
    const { sectionIds } = req.body || {};
    if (!Array.isArray(sectionIds) || sectionIds.length === 0) {
      throw createHttpError(400, "sectionIds must be a non-empty array");
    }

    const page = await ensureHomePage();
    const byId = new Map(page.sections.map((section) => [section.id, section]));
    const nextSections = [];

    sectionIds.forEach((id, index) => {
      const section = byId.get(id);
      if (section) {
        section.order = index + 1;
        nextSections.push(section);
        byId.delete(id);
      }
    });

    byId.forEach((section) => {
      section.order = nextSections.length + 1;
      nextSections.push(section);
    });

    page.sections = nextSections;
    await page.save();
    return sendSuccess(res, serialize(page));
  } catch (err) {
    return next(err);
  }
}

async function createSection(req, res, next) {
  try {
    const { type, content, enabled = true } = req.body || {};
    if (!type) {
      throw createHttpError(400, "type is required");
    }

    const page = await ensureHomePage();
    const maxOrder = page.sections.reduce(
      (max, section) => Math.max(max, section.order ?? 0),
      0
    );
    const id = `${type}-${Date.now().toString(36)}`;
    page.sections.push({
      id,
      type,
      enabled,
      order: maxOrder + 1,
      content: content || {},
    });
    await page.save();
    return sendCreated(res, serialize(page));
  } catch (err) {
    return next(err);
  }
}

async function updateSection(req, res, next) {
  try {
    const page = await ensureHomePage();
    const section = page.sections.find((item) => item.id === req.params.id);
    if (!section) {
      throw createHttpError(404, "Section not found");
    }

    const { type, enabled, content, order } = req.body || {};
    if (type) section.type = type;
    if (enabled !== undefined) section.enabled = enabled;
    if (order !== undefined) section.order = order;
    if (content !== undefined) section.content = content;

    await page.save();
    return sendSuccess(res, serialize(page));
  } catch (err) {
    return next(err);
  }
}

async function removeSection(req, res, next) {
  try {
    const page = await ensureHomePage();
    const before = page.sections.length;
    page.sections = page.sections.filter((item) => item.id !== req.params.id);
    if (page.sections.length === before) {
      throw createHttpError(404, "Section not found");
    }
    page.sections = sortSections(page.sections).map((section, index) => {
      section.order = index + 1;
      return section;
    });
    await page.save();
    return sendSuccess(res, serialize(page));
  } catch (err) {
    return next(err);
  }
}

async function reset(req, res, next) {
  try {
    await HomePage.findOneAndDelete({ key: "home" });
    const page = await HomePage.create(defaults());
    return sendSuccess(res, serialize(page));
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  get,
  update,
  reorder,
  createSection,
  updateSection,
  removeSection,
  reset,
  ensureHomePage,
};
