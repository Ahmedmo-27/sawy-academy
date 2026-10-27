const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const adminDeviceRoutes = require("./routes/adminDeviceRoutes");
const courseRoutes = require("./routes/courseRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const productRoutes = require("./routes/productRoutes");
const faqRoutes = require("./routes/faqRoutes");
const researchRoutes = require("./routes/researchRoutes");
const siteSettingsRoutes = require("./routes/siteSettingsRoutes");
const homePageRoutes = require("./routes/homePageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const cartRoutes = require("./routes/cartRoutes");
const contactRoutes = require("./routes/contactRoutes");
const protectedVideoController = require("./controllers/protectedVideoController");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const requireCsrf = require("./middleware/csrfMiddleware");
const logger = require("./utils/logger");
const { parseTrustProxy } = require("./lib/trustProxy");

dotenv.config();

const app = express();
app.set("trust proxy", parseTrustProxy(process.env.TRUST_PROXY));

const defaultAllowedOrigins = [
  "https://sawy-academy.onrender.com",
  "https://sawy-academy.vercel.app",
  "http://localhost:3000",
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : defaultAllowedOrigins;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Device-Id",
      "X-CSRF-Token",
      "X-Sawy-Upload-Grant",
    ],
  })
);
app.use(express.json());
app.use(requestLogger);
app.use(requireCsrf);

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/admin", adminDeviceRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/products", productRoutes);
app.use("/api/faqs", faqRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/settings", siteSettingsRoutes);
app.use("/api/homepage", homePageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/lessons", lessonRoutes);
app.get("/api/media", protectedVideoController.getMedia);
app.head("/api/media", protectedVideoController.getMedia);
app.use("/api/cart", cartRoutes);
app.use("/api/contact", contactRoutes);

app.use(errorHandler);

async function syncAssetPathsToDatabase() {
  try {
    const Course = require("./models/Course");
    const CourseGroup = require("./models/CourseGroup");
    const Research = require("./models/Research");
    const HomePage = require("./models/HomePage");
    const SiteSettings = require("./models/SiteSettings");

    // 1. Courses
    const courseImages = {
      "spatial-composition-i": "/images/courses/spatial-composition-1.jpg",
      "drawing-and-representation": "/images/courses/drawing-representation.jpg",
      "material-studies": "/images/courses/material-studies.jpg",
      "design-studio-i": "/images/courses/design-studio-1.jpg",
      "biogeometry-level-01": "/images/courses/biogeometry-level-1.jpg",
      "biogeometry-level-02": "/images/courses/biogeometry-level-2.jpg",
      "biogeometry-level-03": "/images/courses/biogeometry-level-3.jpg",
      "parametric-form-algorithmic-design": "/images/courses/design-studio-1.jpg",
    };
    for (const [slug, img] of Object.entries(courseImages)) {
      await Course.updateMany({ slug }, { $set: { image: img } });
    }

    // 2. CourseGroups
    await CourseGroup.updateMany(
      { type: "diploma" },
      { $set: { image: "/images/courses/architecture-diploma.jpg" } }
    );
    await CourseGroup.updateMany(
      { type: "leveled" },
      { $set: { image: "/images/courses/biogeometry-programme.jpg" } }
    );

    // 3. Researches
    const researchImages = {
      r1: "/images/research/biogeometric-housing.jpg",
      r2: "/images/research/earth-construction.jpg",
      r3: "/images/research/sacred-geometry-mosque.jpg",
      r4: "/images/research/urban-courtyards.jpg",
      r5: "/images/research/biogeometry-manual.jpg",
      r6: "/images/research/desert-facades.jpg",
      r7: "/images/research/spatial-drawing-pedagogy.jpg",
      r8: "/images/research/nubian-settlements.jpg",
    };
    for (const [id, img] of Object.entries(researchImages)) {
      await Research.updateMany({ id }, { $set: { image: img } });
    }

    // 4. HomePage
    const home = await HomePage.findOne({ key: "home" });
    if (home && Array.isArray(home.sections)) {
      for (const section of home.sections) {
        if (section.type === "hero") {
          section.content = section.content || {};
          section.content.heroImageUrl = "/images/hero/prof-mohamed-el-sawy.jpg";
        }
        if (section.type === "philosophy") {
          section.content = section.content || {};
          section.content.philosophyImageUrl = "/images/hero/philosophy-drawing.jpg";
        }
      }
      home.markModified("sections");
      await home.save();
    }

    // 5. SiteSettings
    const settings = await SiteSettings.findOne({ key: "default" });
    if (settings) {
      settings.branding = settings.branding || {};
      settings.branding.logoUrl = "/images/brand/logo.svg";

      settings.seo = settings.seo || {};
      settings.seo.ogImageUrl = "/images/brand/og-image.jpg";

      settings.servicesPage = {
        designImageUrl: "/images/services/architectural-design.jpg",
        researchImageUrl: "/images/services/academic-research.jpg",
        processBriefImageUrl: "/images/services/process-brief.jpg",
        processReviewImageUrl: "/images/services/process-review.jpg",
        processDeliveryImageUrl: "/images/services/process-delivery.jpg",
      };

      settings.contactPage = settings.contactPage || {};
      settings.contactPage.imageUrl = "/images/contact/studio-zamalek.jpg";

      await settings.save();
    }
    logger.info("Sawy Academy assets synced to database successfully");
  } catch (e) {
    logger.warn("Could not sync assets to database", { error: e.message });
  }
}

async function startServer() {
  const { assertJwtSecretConfigured } = require("./lib/auth/jwt");
  assertJwtSecretConfigured();

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required to start the backend server");
  }

  await mongoose.connect(mongoUri, {
    // Windows often tries IPv6 first for Atlas SRV hosts, then waits to
    // fall back. That shows up as multi-second queries and proxy resets.
    family: 4,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10_000,
  });

  await syncAssetPathsToDatabase();

  const port = process.env.PORT || 5000;
  const server = app.listen(port, () => {
    logger.info("Sawy Academy API listening", { port });
  });

  // Next.js rewrites reuse keep-alive sockets. Node's 5s default closes the
  // idle socket while the proxy still holds it → ECONNRESET / socket hang up.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error("Failed to start Sawy Academy API", { error: err });
    process.exit(1);
  });
}

module.exports = app;
