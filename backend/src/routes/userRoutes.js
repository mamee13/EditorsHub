const express = require('express');
const router = express.Router();
const crypto = require('crypto');  // Add this line
const User = require('../models/userModel');
const { verifyToken, generateToken } = require('../middleware/authMiddleware');
const { uploadFile, deleteFile } = require('../config/cloudinary');
const { upload } = require('../middleware/uploadMiddleware');
const AppError = require('../utils/AppError');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, passwordConfirm, role, profile } = req.body;
    
    if (!email || !password || !passwordConfirm || !role) {
      throw new AppError('Missing required fields', 400);
    }

    if (password !== passwordConfirm) {
      throw new AppError('Passwords do not match', 400);
    }
    
    if (!profile || !profile.name || !profile.bio || !profile.avatar || !profile.portfolio) {
      throw new AppError('Complete profile information is required (name, bio, avatar, portfolio)', 400);
    }
    
    let user = await User.findOne({ email });
    if (user) {
      throw new AppError('User already exists', 400);
    }

    user = await User.create({
      email,
      password,
      passwordConfirm,
      role,
      profile,
      isActive: false
    });

    try {
      // Generate verification token and send email
      const verificationToken = user.createEmailVerificationToken();
      await user.save({ validateBeforeSave: false });
      
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      // If email fails, revert the user to active state
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      user.isActive = true;
      await user.save({ validateBeforeSave: false });
      
      console.error('Email error:', emailError);
      // Continue with registration but notify about email issue
    }
    
    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.passwordConfirm;
    
    res.status(201).json({
      user: userResponse,
      token,
      message: 'Registration successful. If you did not receive a verification email, please contact support.'
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Registration error:', error);
    next(new AppError('Server error during registration', 500));
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken(user._id);
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      user: userResponse,
      token
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Server error during login', 500));
  }
});

// Get current user
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    next(new AppError('Server error', 500));
  }
});

// Update user role
router.put('/:id/role', verifyToken, async (req, res, next) => {
  try {
    const { role } = req.body;
    
    if (!role || !['client', 'editor'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }
    
    if (req.user._id.toString() !== req.params.id) {
      throw new AppError('Not authorized to update this user', 403);
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    
    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Server error during role update', 500));
  }
});

// Update user profile
router.put('/:id/profile', verifyToken, upload.single('avatar'), async (req, res, next) => {
  try {
    const { name, bio, portfolio } = req.body;
    
    if (req.user._id.toString() !== req.params.id) {
      throw new AppError('Not authorized to update this profile', 403);
    }

    let avatarUrl = req.user.profile.avatar;
    
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await uploadFile(dataURI);
      avatarUrl = result.url;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        profile: {
          name: name || req.user.profile.name,
          bio: bio || req.user.profile.bio,
          avatar: avatarUrl,
          portfolio: portfolio || req.user.profile.portfolio,
        },
      },
      { new: true }
    );
    
    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Server error during profile update', 500));
  }
});

// Update password
router.put('/:id/password', verifyToken, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, passwordConfirm } = req.body;

    // Check if user is authorized (using MongoDB's equals method)
    if (!req.user._id.equals(req.params.id)) {
      throw new AppError('Not authorized to update this user\'s password', 403);
    }

    // Validate input
    if (!currentPassword || !newPassword || !passwordConfirm) {
      throw new AppError('Please provide current password, new password and password confirmation', 400);
    }

    // Check if new password and confirm match
    if (newPassword !== passwordConfirm) {
      throw new AppError('New password and confirmation do not match', 400);
    }

    // Get user with password
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Server error during password update', 500));
  }
});

// Verify email
router.get('/verify-email/:token', async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.isActive = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Error verifying email', 500));
  }
});

// Forgot password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('No user found with this email address', 404);
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Error sending password reset email', 500));
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(new AppError('Error resetting password', 500));
  }
});

module.exports = router;