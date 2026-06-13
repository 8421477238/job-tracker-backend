const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  uploadResume,
  getResumes,
  deleteResume,
} = require("../controllers/resumeController");

router.post(
  "/upload",
  verifyToken,
  upload.single("resume"),
  uploadResume
);

router.get("/", verifyToken, getResumes);

router.delete("/:id", verifyToken, deleteResume);

module.exports = router;