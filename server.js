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
const researchRoutes = require("./routes/researchRoutes");
const siteSettingsRoutes = require("./routes/siteSettingsRoutes");
const homePageRoutes = require("./routes/homePageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const cartRoutes = require("./routes/cartRoutes");
const errorHandler = require("./middleware/errorHandler");
const requestLogger = require("./middleware/requestLogger");
const logger = require("./utils/logger");

dotenv.config();

const app = express();

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
  })
);
app.use(express.json());
app.use(requestLogger);

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/admin", adminDeviceRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/products", productRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/settings", siteSettingsRoutes);
app.use("/api/homepage", homePageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/cart", cartRoutes);

app.use(errorHandler);

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required to start the backend server");
  }

  await mongoose.connect(mongoUri);

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    logger.info("Sawy Academy API listening", { port });
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error("Failed to start Sawy Academy API", { error: err });
    process.exit(1);
  });
}

module.exports = app;
