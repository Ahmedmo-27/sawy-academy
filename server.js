const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const productRoutes = require("./routes/productRoutes");
const researchRoutes = require("./routes/researchRoutes");
const siteSettingsRoutes = require("./routes/siteSettingsRoutes");
const homePageRoutes = require("./routes/homePageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const errorHandler = require("./middleware/errorHandler");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/auth", authRoutes);
app.use("/api/research", researchRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/products", productRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/settings", siteSettingsRoutes);
app.use("/api/homepage", homePageRoutes);
app.use("/api/upload", uploadRoutes);

app.use(errorHandler);

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required to start the backend server");
  }

  await mongoose.connect(mongoUri);

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Sawy Academy API listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = app;
