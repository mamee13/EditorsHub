const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Message = require('../models/messageModel');
const { upload } = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../config/cloudinary');
const Job = require('../models/jobModel');
const AppError = require('../utils/AppError');

// Get messages for a job

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
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = await uploadFile(dataURI);
        
        if (!result || !result.url) {
          throw new Error('File upload failed');
        }

        attachment = {
          url: result.url,
          publicId: result.public_id || '',
          type: req.file.mimetype.startsWith('image/') ? 'image' : 'file'
        };
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        throw new AppError('File upload failed', 400);
      }
    }

    // Validate that either content or attachment is present
    if (!content && !attachment) {
      throw new AppError('Message must contain either text or an attachment', 400);
    }

    const messageData = {
      jobId,
      senderId: req.user._id,
      content: content || '',
      attachments: attachment ? [attachment] : []
    };

    const message = await Message.create(messageData);

    const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'profile.name profile.avatar');

    if (!populatedMessage) {
      throw new AppError('Error creating message', 500);
    }

    // Emit the new message to connected clients
    if (req.app.get('io')) {
      req.app.get('io').to(jobId).emit('new_message', populatedMessage);
    }
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Message creation error:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError(error.message || 'Error sending message', 500));
  }
});

router.get('/recent', verifyToken, async (req, res, next) => {
  try {
    // Find recent messages for jobs where the user is either client or editor
    const jobs = await Job.find({
      $or: [
        { clientId: req.user._id },
        { editorId: req.user._id }
      ]
    }).select('_id');

    const jobIds = jobs.map(job => job._id);

    const messages = await Message.find({
      jobId: { $in: jobIds }
    })
    .populate('senderId', 'profile.name profile.avatar')
    .populate('jobId', 'title')
    .sort('-createdAt')
    .limit(4);

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in recent messages:', error);
    next(new AppError('Error fetching messages', 500));
  }
});

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
module.exports = router;