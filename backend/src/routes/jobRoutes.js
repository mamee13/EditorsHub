const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Job = require('../models/jobModel');
const JobApplication = require('../models/jobApplicationModel');
const Notification = require('../models/notificationModel');
const { uploadFile } = require('../config/cloudinary');
const { upload } = require('../middleware/uploadMiddleware');
const AppError = require('../utils/AppError');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
      initialFiles: uploadedFiles,
      budget: req.body.budget,
      deadline: req.body.deadline,
      deliverySpeed: req.body.deliverySpeed
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

router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let stats = {
      activeJobs: 0,
      completedJobs: 0,
      totalCount: 0,
      unreadMessages: 0
    };

    if (role === 'editor') {
      stats.activeJobs = await Job.countDocuments({ editorId: userId, status: 'in_progress' });
      stats.completedJobs = await Job.countDocuments({ editorId: userId, status: 'completed' });
      stats.totalCount = await Job.countDocuments({ editorId: userId });
    } else {
      stats.activeJobs = await Job.countDocuments({ clientId: userId, status: 'in_progress' });
      stats.completedJobs = await Job.countDocuments({ clientId: userId, status: 'completed' });
      stats.totalCount = await Job.countDocuments({ clientId: userId });
    }

    stats.unreadMessages = 0;
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

router.get('/my-assignments', verifyToken, async (req, res, next) => {
  try {
    if (req.user.role !== 'editor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignments = await Job.find({
      editorId: req.user._id,
      status: { $in: ['assigned', 'in_progress', 'review'] }
    })
    .populate('clientId', 'profile.name')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json(assignments);
  } catch (error) {
    next(error);
  }
});

// Apply for a job (Editor only)
// router.post('/:id/apply', verifyToken, async (req, res, next) => {
//   try {
//     if (req.user.role !== 'editor') {
//       throw new AppError('Only editors can apply for jobs', 403);
//     }

//     const job = await Job.findById(req.params.id);
//     if (!job || job.status !== 'open') {
//       throw new AppError('Job not available', 400);
//     }

//     const application = await JobApplication.create({
//       jobId: job._id,
//       editorId: req.user._id,
//       message: req.body.message
//     });

//     await Notification.create({
//       userId: job.clientId,
//       type: 'new_application',
//       message: `New application received for job: ${job.title}`,
//       jobId: job._id
//     });

//     res.status(201).json(application);
//   } catch (error) {
//     if (error instanceof AppError) {
//       return res.status(error.statusCode).json({ message: error.message });
//     }
//     next(new AppError('Error applying for job', 500));
//   }
// });

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

// Then keep the specific job route AFTER the special routes
// Get specific job details
router.get('/:jobId', verifyToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('clientId', 'profile.name profile.avatar')
      .populate('editorId', 'profile.name profile.avatar');

    if (!job) {
      return res.status(404).json({ status: 'error', message: 'Job not found' });
    }

    // If user is editor, only return necessary job details
    if (req.user.role === 'editor') {
      const jobDetails = {
        _id: job._id,
        title: job.title,
        description: job.description,
        status: job.status,
        deadline: job.deadline,
        budget: job.budget,
        deliverySpeed: job.deliverySpeed,
        initialFiles: job.initialFiles,
        client: job.clientId ? {
          name: job.clientId.profile.name,
          avatar: job.clientId.profile.avatar
        } : null
      };
      return res.json(jobDetails);
    }

    // If user is client or admin, return full job details
    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching job details' });
  }
});

// Get job applications (Client only)
router.get('/:jobId/applications', verifyToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job || job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Access denied' 
      });
    }

    const applications = await JobApplication.find({ jobId: req.params.jobId })
      .populate('editorId', 'profile.name profile.avatar')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    next(new AppError('Error fetching applications', 500));
  }
});

// Submit final files (Editor only)
router.post('/:id/submit', verifyToken, upload.array('files', 5), async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job || job.editorId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await uploadFile(dataURI);
        uploadedFiles.push({
          url: result.url,
          publicId: result.public_id,
          name: file.originalname
        });
      }
    }

    job.finalFiles = uploadedFiles;
    job.status = 'delivered';
    await job.save();

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: job.budget * 100, // Stripe uses cents
      currency: 'usd',
      metadata: {
        jobId: job._id.toString()
      }
    });

    job.paymentIntentId = paymentIntent.id;
    await job.save();

    // Notify client
    await Notification.create({
      userId: job.clientId,
      type: 'files_submitted',
      message: `Final files submitted for job: ${job.title}`,
      jobId: job._id
    });

    res.status(200).json({ message: 'Files submitted successfully' });
  } catch (error) {
    next(new AppError('Error submitting files', 500));
  }
});

// Cancel job
router.put('/:id/cancel', verifyToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('clientId', 'profile.name')
      .populate('editorId', 'profile.name');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check authorization
    const isAuthorized = 
      job.clientId._id.toString() === req.user._id.toString() || 
      (job.editorId && job.editorId._id.toString() === req.user._id.toString());

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Validate job status
    if (!['open', 'assigned', 'in_progress'].includes(job.status)) {
      return res.status(400).json({ message: 'Cannot cancel job in current status' });
    }

    // Update job status
    job.status = 'cancelled';
    await job.save();

    // Create notification
    const notifyUserId = req.user._id.toString() === job.clientId._id.toString() 
      ? job.editorId?._id 
      : job.clientId._id;

    if (notifyUserId) {
      await Notification.create({
        userId: notifyUserId,
        type: 'job_cancelled',
        message: `Job "${job.title}" has been cancelled`,
        jobId: job._id
      });
    }

    return res.status(200).json({ message: 'Job cancelled successfully' });
  } catch (error) {
    console.error('Cancel job error:', error);
    return res.status(500).json({ message: 'Error cancelling job' });
  }
});

// Create payment session
router.post('/:id/payment', verifyToken, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job || job.clientId.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized', 403);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Payment for job: ${job.title}`,
          },
          unit_amount: job.budget * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/dashboard/jobs/${job._id}?payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/jobs/${job._id}?payment=cancelled`,
      metadata: {
        jobId: job._id.toString()
      }
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    next(new AppError('Error creating payment session', 500));
  }
});

router.post('/:jobId/apply', verifyToken, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const editorId = req.user._id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user has already applied
    const existingApplication = await JobApplication.findOne({
      jobId: jobId,
      editorId: editorId
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Create new application with the required message field
    const application = new JobApplication({
      jobId: jobId,
      editorId: editorId,
      status: 'pending',
      message: req.body.message || req.body.coverLetter || '' // Try both fields and provide a default
    });

    if (!application.message) {
      return res.status(400).json({ message: 'Application message is required' });
    }

    await application.save();

    // Notify client about new application
    await Notification.create({
      userId: job.clientId,
      type: 'new_application',
      message: `New application received for job: ${job.title}`,
      jobId: job._id
    });

    res.status(201).json({ message: 'Application submitted successfully', application });

  } catch (error) {
    console.error('Error in job application:', error);
    res.status(500).json({ message: 'Error applying for job', error: error.message });
  }
});

module.exports = router;
