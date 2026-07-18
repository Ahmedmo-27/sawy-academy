require("dotenv").config();

const mongoose = require("mongoose");

const seedResearches = require("./seedResearches");
const seedProjects = require("./seedProjects");
const seedProducts = require("./seedProducts");
const seedCourses = require("./seedCourses");
const seedAdmin = require("./seedAdmin");
const seedSiteContent = require("./seedSiteContent");

async function seed() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required to run seeders");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");
  console.log("Seeding...");

  await seedResearches();
  await seedProjects();
  await seedProducts();
  await seedCourses();
  await seedAdmin();
  await seedSiteContent();

  console.log("Seed complete");
  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
