const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Message = require('../models/messageModel');
const { upload } = require('../middleware/uploadMiddleware');
const cloudinary = require('../config/cloudinary');
const Job = require('../models/jobModel');

// Get messages for a job
router.get('/:jobId', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized to view messages
    if (job.clientId.toString() !== req.user._id.toString() && 
        job.editorId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ jobId: req.params.jobId })
      .populate('senderId', 'profile.name profile.avatar')
      .sort('createdAt');

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// Send a message with optional file attachment
router.post('/', verifyToken, upload.single('file'), async (req, res) => {
  try {
    const { jobId, content } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is authorized to send messages
    if (job.clientId.toString() !== req.user._id.toString() && 
        job.editorId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // This file is already correctly using Cloudinary for file uploads
    // The relevant code is in the POST route:
    let attachment;
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await uploadFile(dataURI);
      attachment = {
        url: result.url,
        publicId: result.public_id,
        type: req.file.mimetype.split('/')[0]
      };
    }

    const message = await Message.create({
      jobId,
      senderId: req.user._id,
      content,
      attachments: attachment ? [attachment] : []
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'profile.name profile.avatar');

    // Emit real-time notification
    req.app.get('io').to(jobId).emit('new_message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Error sending message' });
  }
});

module.exports = router;