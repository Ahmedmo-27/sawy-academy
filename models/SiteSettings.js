const mongoose = require("mongoose");

const navChildSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const navItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    href: { type: String, default: "", trim: true },
    children: { type: [navChildSchema], default: undefined },
  },
  { _id: false }
);

const linkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    href: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const pageHeaderSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: "", trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    branding: {
      name: { type: String, required: true, trim: true },
      wordmark: { type: String, required: true, trim: true },
      wordmarkSuffix: { type: String, default: "Academy", trim: true },
      professor: { type: String, required: true, trim: true },
      professorTitle: { type: String, required: true, trim: true },
      role: { type: String, default: "", trim: true },
      institution: { type: String, default: "", trim: true },
      affiliation: { type: String, default: "", trim: true },
      tagline: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      mobile: { type: String, default: "", trim: true },
      address: {
        line1: { type: String, default: "", trim: true },
        line2: { type: String, default: "", trim: true },
        governorate: { type: String, default: "", trim: true },
        country: { type: String, default: "", trim: true },
        postal: { type: String, default: "", trim: true },
      },
      officeHours: { type: String, default: "", trim: true },
      established: { type: String, default: "", trim: true },
      footerBlurb: { type: String, default: "", trim: true },
    },
    seo: {
      title: { type: String, default: "", trim: true },
      description: { type: String, default: "", trim: true },
    },
    navigation: {
      items: { type: [navItemSchema], default: [] },
    },
    footer: {
      links: { type: [linkSchema], default: [] },
    },
    pageHeaders: {
      type: Map,
      of: pageHeaderSchema,
      default: {},
    },
    contactPage: {
      intro: { type: String, default: "", trim: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("SiteSettings", siteSettingsSchema);
