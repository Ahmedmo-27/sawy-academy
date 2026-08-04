const SiteSettings = require("../models/SiteSettings");
const HomePage = require("../models/HomePage");
const {
  branding,
  seo,
  navigation,
  footer,
  pageHeaders,
  contactPage,
  homeSections,
} = require("./data/siteDefaults");

async function seedSiteContent() {
  await SiteSettings.deleteMany({});
  await HomePage.deleteMany({});

  await SiteSettings.create({
    key: "default",
    branding,
    seo,
    navigation,
    footer,
    pageHeaders,
    contactPage,
  });

  await HomePage.create({
    key: "home",
    sections: homeSections,
  });

  console.log("  SiteSettings: 1 document");
  console.log("  HomePage: 1 document with", homeSections.length, "sections");
}

module.exports = seedSiteContent;
