const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/email");

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        career_role: user.career_role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const [existingUser] = await db.execute(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.execute(
      `
      INSERT INTO users
      (name, email, password, career_role)
      VALUES (?, ?, ?, ?)
      `,
      [name, email, hashedPassword, "React Developer"]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const user = users[0];

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.execute(
      `
      UPDATE users
      SET reset_token = ?, reset_token_expires = ?
      WHERE id = ?
      `,
      [hashedToken, expiresAt, user.id]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: `"Job Tracker" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Job Tracker Password",
      html: `
        <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:30px;">
          <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:18px;">
            <h2 style="color:#2563eb;">Reset Your Password</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your Job Tracker password.</p>
            <p>Click the button below to create a new password.</p>
            <a href="${resetLink}" style="display:inline-block; padding:14px 22px; background:#2563eb; color:white; text-decoration:none; border-radius:12px; font-weight:bold;">
              Reset Password
            </a>
            <p style="margin-top:20px;">This link will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to send reset email",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const [users] = await db.execute(
      `
      SELECT *
      FROM users
      WHERE reset_token = ? AND reset_token_expires > NOW()
      `,
      [hashedToken]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute(
      `
      UPDATE users
      SET password = ?, reset_token = NULL, reset_token_expires = NULL
      WHERE id = ?
      `,
      [hashedPassword, users[0].id]
    );

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const [users] = await db.execute(
      `
      SELECT id, name, email, mobile, career_role
      FROM users
      WHERE id = ?
      `,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: users[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, mobile, career_role } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const [existingEmail] = await db.execute(
      `
      SELECT id
      FROM users
      WHERE email = ? AND id != ?
      `,
      [email, req.user.id]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already used by another account",
      });
    }

    await db.execute(
      `
      UPDATE users
      SET name = ?, email = ?, mobile = ?, career_role = ?
      WHERE id = ?
      `,
      [name, email, mobile, career_role, req.user.id]
    );

    const [updatedUser] = await db.execute(
      `
      SELECT id, name, email, mobile, career_role
      FROM users
      WHERE id = ?
      `,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const [users] = await db.execute("SELECT password FROM users WHERE id = ?", [
      req.user.id,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.execute("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      req.user.id,
    ]);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    await db.execute("DELETE FROM users WHERE id = ?", [req.user.id]);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};