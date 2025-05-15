const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Message = require('../models/messageModel');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../config/cloudinary');
const Job = require('../models/jobModel');
const AppError = require('../utils/AppError');

// Get messages for a job
router.get('/:jobId', verifyToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (job.clientId.toString() !== req.user._id.toString() && 
        job.editorId?.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    const messages = await Message.find({ jobId: req.params.jobId })
      .populate('senderId', 'profile.name profile.avatar')
      .sort('createdAt');

    res.status(200).json(messages);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Error fetching messages', 500));
  }
});

// Send a message with optional file attachment
router.post('/', verifyToken, upload.single('file'), async (req, res, next) => {
  try {
    const { jobId, content } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (job.clientId.toString() !== req.user._id.toString() && 
        job.editorId?.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

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

    req.app.get('io').to(jobId).emit('new_message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Error sending message', 500));
  }
});

module.exports = router;