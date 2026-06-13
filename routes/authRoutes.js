const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/authController");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);

router.put("/reset-password/:token", resetPassword);

router.get("/profile", verifyToken, getProfile);

router.put("/profile", verifyToken, updateProfile);

router.put("/change-password", verifyToken, changePassword);

router.delete("/delete-account", verifyToken, deleteAccount);

module.exports = router;