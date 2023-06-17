const mongoose = require('mongoose');

const totalVisitsSchema = mongoose.Schema(
  {
    visitsCount: {
      type: Number,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const TotalVisits = mongoose.model("TotalVisits", totalVisitsSchema);
module.exports = TotalVisits;