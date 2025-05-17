const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const AppError = require('../utils/AppError');

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

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Attach user and token data to request object
    req.user = user;
    req.token = decoded;  // Add decoded token data to request
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    next(new AppError('Server error during authentication', 500));
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

module.exports = { verifyToken, generateToken };