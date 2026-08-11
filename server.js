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

app.use(errorHandler);

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
