require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// Database Connection
require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const resumeRoutes = require("./routes/resumeRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static Upload Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resumes", resumeRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Job Tracker API Running");
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    message: "Route Not Found",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});