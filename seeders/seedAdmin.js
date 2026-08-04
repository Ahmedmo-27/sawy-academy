const User = require("../models/User");
const { hashPassword } = require("../lib/auth/password");

const DEFAULT_ADMIN = {
  name: "Sawy Academy Admin",
  email: "admin@sawy.academy",
  password: "SawyAdmin!2026",
};

async function seedAdmin() {
  const name = process.env.SEED_ADMIN_NAME || DEFAULT_ADMIN.name;
  const email = (
    process.env.SEED_ADMIN_EMAIL || DEFAULT_ADMIN.email
  ).toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || DEFAULT_ADMIN.password;

  const user = await User.findOneAndUpdate(
    { email },
    {
      name,
      email,
      role: "admin",
      passwordHash: hashPassword(password),
    },
    { new: true, upsert: true, runValidators: true }
  );

  console.log(`  User: seeded admin ${user.email}`);
  return user;
}

if (require.main === module) {
  require("dotenv").config();
  const mongoose = require("mongoose");

  (async () => {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is required to seed the admin user");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    await seedAdmin();
    await mongoose.disconnect();
  })().catch(async (err) => {
    console.error("Admin seed failed:", err);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}

module.exports = seedAdmin;
