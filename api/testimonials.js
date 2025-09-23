const express = require("express");
const router = express.Router();
const Testimonial = require('../models/testimonialModel');

// Fetch all testimonials
router.get("/fetchAllTestimonials", async (req, res) => {
  try {
    const testimonials = await Testimonial.find({}).sort({ createdAt: -1 });
    return res.status(200).json(testimonials);
  } catch (error) {
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;


