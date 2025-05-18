const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  type: String
});

const messageSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return this.attachments.length === 0; // Content is required only if there are no attachments
    }
  },
  attachments: [attachmentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);