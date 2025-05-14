const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { verifyToken, generateToken } = require('../middleware/authMiddleware');
const { uploadFile, deleteFile } = require('../config/cloudinary');
const { upload } = require('../middleware/uploadMiddleware');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, profile } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if profile information is complete
    if (!profile || !profile.name || !profile.bio || !profile.avatar || !profile.portfolio) {
      return res.status(400).json({ 
        message: 'Complete profile information is required (name, bio, avatar, portfolio)' 
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = await User.create({
      email,
      password,
      role,
      profile
    });
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json({
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id);
    
    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(200).json({
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user (GET /me)
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (PUT /users/:id/role)
router.put('/:id/role', verifyToken, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role || !['client', 'editor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    
    // Only allow users to update their own role
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this user' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile (PUT /users/:id/profile)
// Update the profile route to handle avatar upload
router.put('/:id/profile', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    const { name, bio, portfolio } = req.body;
    
    // Only allow users to update their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    let avatarUrl = req.user.profile.avatar;
    
    // Handle avatar upload if file is provided
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
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;