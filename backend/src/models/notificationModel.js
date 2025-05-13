const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['job_assigned', 'job_completed', 'new_application'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;