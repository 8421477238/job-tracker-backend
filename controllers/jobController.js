const db = require("../config/db");

const addJob = async (req, res) => {
  try {
    const { company_name, role, status, notes } = req.body;

    await db.execute(
      `INSERT INTO jobs
      (company_name, role, status, notes, user_id)
      VALUES (?, ?, ?, ?, ?)`,
      [
        company_name,
        role,
        status || "Applied",
        notes,
        req.user.id,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Job added successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getJobs = async (req, res) => {
  try {
    const [jobs] = await db.execute(
      `
      SELECT *
      FROM jobs
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      jobs,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const updateJob = async (req, res) => {
  try {
    const { status } = req.body;

    const [result] = await db.execute(
      `
      UPDATE jobs
      SET status = ?
      WHERE id = ? AND user_id = ?
      `,
      [
        status,
        req.params.id,
        req.user.id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job updated successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const deleteJob = async (req, res) => {
  try {
    const [result] = await db.execute(
      `
      DELETE FROM jobs
      WHERE id = ? AND user_id = ?
      `,
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

const getJobStats = async (req, res) => {
  try {
    const [stats] = await db.execute(
      `
      SELECT status, COUNT(*) as count
      FROM jobs
      WHERE user_id = ?
      GROUP BY status
      `,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      stats,
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
  addJob,
  getJobs,
  updateJob,
  deleteJob,
  getJobStats,
};