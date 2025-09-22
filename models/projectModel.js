const mongoose = require('mongoose');

const projectSchema = mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['professional', 'personal'],
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    stack: {
      type: String,
      required: true,
      enum: ['fullStack', 'frontend', 'backend'],
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    repoName: {
      type: String,
      required: true,
      trim: true,
    },
    liveUrl: {
      type: String,
      required: true,
      trim: true,
    },
    techs: [
      {
        url: {
          type: String,
          required: true,
          trim: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    desc: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;