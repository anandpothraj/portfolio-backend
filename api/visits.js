const express = require("express");
const router = express.Router();
const TotalVisits = require('../models/totalVisitsModel');

// Fetch site visits
router.get("/fetchSiteVisits", async (req, res) => {
  try {
    const totalVisits = await TotalVisits.findOne();
    if (totalVisits) {
      res.status(200).json({ visitsCount: totalVisits.visitsCount });
    } else {
      res.status(200).json({ visitsCount: 0 });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update site visits
router.post("/updateSiteVisits", async (req, res) => {
  try {
    const { visitsCount } = req.body;
    let totalVisits = await TotalVisits.findOne();
    if (totalVisits) {
      totalVisits.visitsCount = visitsCount;
    } else {
      totalVisits = new TotalVisits({ visitsCount });
    }
      await totalVisits.save();
      res.status(201).json({ message: "Visits count updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
