const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
  addJob,
  getJobs,
  updateJob,
  deleteJob,
  getJobStats,
} = require("../controllers/jobController");

router.post("/", verifyToken, addJob);

router.get("/stats", verifyToken, getJobStats);

router.get("/", verifyToken, getJobs);

router.put("/:id", verifyToken, updateJob);

router.delete("/:id", verifyToken, deleteJob);

module.exports = router;