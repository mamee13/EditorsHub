const { createClient } = require('@supabase/supabase-js');
const User = require('../models/userModel');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const verifyToken = async (req, res, next) => {
  try {
    // Development testing bypass
    if (process.env.NODE_ENV === 'development' && req.headers['x-test-user-id']) {
      const testUser = await User.findById(req.headers['x-test-user-id']);
      if (testUser) {
        req.user = testUser;
        return next();
      }
    }

    // Regular Supabase auth for production
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
    // Get user from database
    const user = await User.findOne({ supabaseId: data.user.id });
    
    // If user doesn't exist in our database yet, create a new one
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found in database',
        supabaseUser: data.user
      });
    }
    
    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

module.exports = { verifyToken };