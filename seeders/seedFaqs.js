const Faq = require("../models/Faq");
const faqs = require("./data/faqs");

async function seedFaqs() {
  await Faq.deleteMany({});
  const docs = await Faq.insertMany(faqs);
  console.log(`  Faq: ${docs.length} documents`);
  return docs;
}

if (require.main === module) {
  require("dotenv").config();
  const mongoose = require("mongoose");

  (async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is required to seed FAQs");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
      serverSelectionTimeoutMS: 10_000,
    });
    console.log("Connected to MongoDB");
    await seedFaqs();
    await mongoose.disconnect();
  })().catch(async (err) => {
    console.error("FAQ seed failed:", err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = seedFaqs;
