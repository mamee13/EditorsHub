const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const { verifyToken } = require('../middleware/authMiddleware');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Create or update user after Supabase auth
router.post('/register', async (req, res) => {
  try {
    const { supabaseId, email, role, profile } = req.body;
    
    if (!supabaseId || !email || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if profile information is complete
    if (!profile || !profile.name || !profile.bio || !profile.avatar || !profile.portfolio) {
      return res.status(400).json({ 
        message: 'Complete profile information is required (name, bio, avatar, portfolio)' 
      });
    }
    
    // Check if user already exists
    let user = await User.findOne({ supabaseId });
    
    if (user) {
      // Update existing user
      user.email = email;
      user.role = role;
      user.profile = profile;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        supabaseId,
        email,
        role,
        profile
      });
    }
    
    res.status(201).json(user);
  } catch (error) {
    console.error('User registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
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
router.put('/:id/profile', verifyToken, async (req, res) => {
  try {
    const { name, bio, avatar, portfolio } = req.body;
    
    // Only allow users to update their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        profile: {
          name: name || req.user.profile.name,
          bio: bio || req.user.profile.bio,
          avatar: avatar || req.user.profile.avatar,
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