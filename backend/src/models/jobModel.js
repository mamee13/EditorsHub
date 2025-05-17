const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    initialFiles: [{
      type: String,  // URLs to files
      required: true
    }],
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'open'
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    editorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    budget: {
      type: Number,
      required: true
    },
    deadline: {
      type: Date,
      required: true
    },
    deliverySpeed: {
      type: String,
      enum: ['standard', 'express', 'rush'],
      required: true
    },
    // Add category field
    category: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;