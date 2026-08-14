require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const movieRoutes = require("./routes/movieRoutes");
const listRoutes = require("./routes/listRoutes");
const progressRoutes = require("./routes/progressRoutes");
const searchRoutes = require("./routes/searchRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const path = require("path");

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/search", searchRoutes);

// Serve Frontend static production build on single port
const frontendDist = path.join(__dirname, "../../frontend/dist");
app.use(express.static(frontendDist));

app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Netflix-Clone running on http://localhost:${PORT}`);
  console.log(`📡 Unified Frontend & API available at http://localhost:${PORT}`);
});

module.exports = app;
