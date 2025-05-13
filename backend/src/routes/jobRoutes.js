const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Job = require('../models/jobModel');
const JobApplication = require('../models/jobApplicationModel');
const Notification = require('../models/notificationModel');

// Create a new job (Client only)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can create jobs' });
    }

    const job = await Job.create({
      ...req.body,
      clientId: req.user._id,
      status: 'open'
    });

    res.status(201).json(job);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Error creating job' });
  }
});

// Get all jobs (with filters)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    // Editors see all open jobs, clients see only their jobs
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
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
});

// Apply for a job (Editor only)
router.post('/:id/apply', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Only editors can apply for jobs' });
    }

    const job = await Job.findById(req.params.id);
    if (!job || job.status !== 'open') {
      return res.status(400).json({ message: 'Job not available' });
    }

    const application = await JobApplication.create({
      jobId: job._id,
      editorId: req.user._id,
      message: req.body.message
    });

    // Notify client about new application
    await Notification.create({
      userId: job.clientId,
      type: 'new_application',
      message: `New application received for job: ${job.title}`,
      jobId: job._id
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('Apply job error:', error);
    res.status(500).json({ message: 'Error applying for job' });
  }
});

// Get job applications (Client only)
router.get('/:id/applications', verifyToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job || job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const applications = await JobApplication.find({ jobId: req.params.id })
      .populate('editorId', 'profile.name profile.portfolio');
    
    res.status(200).json(applications);
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Error fetching applications' });
  }
});

// Assign editor to job (Client only)
router.put('/:id/assign', verifyToken, async (req, res) => {
  try {
    const { editorId } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job || job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({ message: 'Job is not open for assignment' });
    }

    // Update job status and assign editor
    job.status = 'assigned';
    job.editorId = editorId;
    await job.save();

    // Update application status
    await JobApplication.updateMany(
      { jobId: job._id },
      { status: 'rejected' }
    );
    await JobApplication.findOneAndUpdate(
      { jobId: job._id, editorId },
      { status: 'accepted' }
    );

    // Create notification for assigned editor
    await Notification.create({
      userId: editorId,
      type: 'job_assigned',
      message: `You have been assigned to the job: ${job.title}`,
      jobId: job._id
    });

    res.status(200).json(job);
  } catch (error) {
    console.error('Assign editor error:', error);
    res.status(500).json({ message: 'Error assigning editor' });
  }
});

module.exports = router;