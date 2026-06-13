const db = require("../config/db");
const fs = require("fs");

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a resume file",
      });
    }

    const fileName = req.file.filename;
    const originalName = req.file.originalname;
    const filePath = req.file.path;

    await db.execute(
      `
      INSERT INTO resumes
      (user_id, file_name, original_name, file_path)
      VALUES (?, ?, ?, ?)
      `,
      [req.user.id, fileName, originalName, filePath]
    );

    res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resume: {
        fileName,
        originalName,
        filePath,
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

const getResumes = async (req, res) => {
  try {
    const [resumes] = await db.execute(
      `
      SELECT *
      FROM resumes
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      resumes,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const deleteResume = async (req, res) => {
  try {
    const [resume] = await db.execute(
      `
      SELECT *
      FROM resumes
      WHERE id = ? AND user_id = ?
      `,
      [req.params.id, req.user.id]
    );

    if (resume.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    const filePath = resume[0].file_path;

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.execute(
      `
      DELETE FROM resumes
      WHERE id = ? AND user_id = ?
      `,
      [req.params.id, req.user.id]
    );

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
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
  uploadResume,
  getResumes,
  deleteResume,
};