const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Job = require('../models/jobModel');
const JobApplication = require('../models/jobApplicationModel');
const Notification = require('../models/notificationModel');
// const User = require('../models/userModel');
const { uploadFile, deleteFile } = require('../config/cloudinary');
const { upload } = require('../middleware/uploadMiddleware');
const AppError = require('../utils/AppError');

// Create a new job (Client only)
router.post('/', verifyToken, upload.array('files', 5), async (req, res, next) => {
  try {
    if (req.user.role !== 'client') {
      throw new AppError('Only clients can create jobs', 403);
    }

    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await uploadFile(dataURI);
        uploadedFiles.push(result.url);
      }
    }

    const job = await Job.create({
      ...req.body,
      clientId: req.user._id,
      status: 'open',
      initialFiles: uploadedFiles
    });

    res.status(201).json(job);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Error creating job', 500));
  }
});

// Get all jobs (with filters)
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    if (req.user.role === 'client') {
      filter.clientId = req.user._id;
    } else if (req.user.role === 'editor') {
      filter.status = 'open';
    }

    const jobs = await Job.find(filter)
      .populate('clientId', 'profile.name')
      .populate('editorId', 'profile.name');
    
    res.status(200).json(jobs);
  } catch (error) {
    next(new AppError('Error fetching jobs', 500));
  }
});

// Apply for a job (Editor only)
router.post('/:id/apply', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'editor') {
      throw new AppError('Only editors can apply for jobs', 403);
    }

    const job = await Job.findById(req.params.id);
    if (!job || job.status !== 'open') {
      throw new AppError('Job not available', 400);
    }

    const application = await JobApplication.create({
      jobId: job._id,
      editorId: req.user._id,
      message: req.body.message
    });

    await Notification.create({
      userId: job.clientId,
      type: 'new_application',
      message: `New application received for job: ${job.title}`,
      jobId: job._id
    });

    res.status(201).json(application);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Error applying for job', 500));
  }
});

// Get job applications (Client only)
router.get('/:id/applications', verifyToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.clientId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    const applications = await JobApplication.find({ jobId: req.params.id })
      .populate('editorId', 'profile.name profile.portfolio');
    
    res.status(200).json(applications);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Error fetching applications', 500));
  }
});

// Assign editor to job (Client only)
router.put('/:id/assign', verifyToken, async (req, res, next) => {
  try {
    const { editorId } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job || job.clientId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    if (job.status !== 'open') {
      throw new AppError('Job is not open for assignment', 400);
    }

    job.status = 'assigned';
    job.editorId = editorId;
    await job.save();

    await JobApplication.updateMany(
      { jobId: job._id },
      { status: 'rejected' }
    );
    await JobApplication.findOneAndUpdate(
      { jobId: job._id, editorId },
      { status: 'accepted' }
    );

    await Notification.create({
      userId: editorId,
      type: 'job_assigned',
      message: `You have been assigned to the job: ${job.title}`,
      jobId: job._id
    });

    res.status(200).json(job);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Error assigning editor', 500));
  }
});

module.exports = router;