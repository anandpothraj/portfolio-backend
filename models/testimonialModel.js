const mongoose = require('mongoose');

const testimonialSchema = mongoose.Schema(
  {
    userImage: {
      type: String,
      required: true,
      trim: true,
    },
    userLinkedIn: {
      type: String,
      required: true,
      trim: true,
    },
    userTwitter: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userDesignation: {
      type: String,
      required: true,
      trim: true,
    },
    userReview: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Testimonial = mongoose.model("Testimonial", testimonialSchema);
module.exports = Testimonial;


