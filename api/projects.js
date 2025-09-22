const express = require("express");
const router = express.Router();
const Project = require('../models/projectModel');

// Fetch two recent personal and two recent professional projects
router.get("/fetchRecentProjects", async (req, res) => {
  try {
    const [personal, professional] = await Promise.all([
      Project.find({ type: 'personal' }).sort({ createdAt: -1 }).limit(2),
      Project.find({ type: 'professional' }).sort({ createdAt: -1 }).limit(2),
    ]);

    return res.status(200).json({ personal, professional });
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});

// Fetch all projects
router.get("/fetchAllProjects", async (req, res) => {
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 });
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;