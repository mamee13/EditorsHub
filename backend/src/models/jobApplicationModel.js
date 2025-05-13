const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    editorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Ensure one editor can only apply once to a job
jobApplicationSchema.index({ jobId: 1, editorId: 1 }, { unique: true });

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
module.exports = JobApplication;