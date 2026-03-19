/**
 * Authentication Middleware
 * Handles JWT verification and user authentication
 */

const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'studyverse-secret-key-change-in-production';

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      name: user.name ,
      role:user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded token or null
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
};

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  
  next();
};

/**
 * Admin authentication middleware
 * Ensures the user is an admin
 */
const authenticateAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admins only.'
    });
  }
  next();
};

/**
 * Get current user from database
 * @param {string} userId - User ID
 * @returns {Object|null} - User object or null
 */
const getCurrentUser = (userId) => {
  const user = db.findById('users', userId);
  if (user) {
    // Remove password from user object
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  authenticateAdmin, // Add this to exports
  getCurrentUser,
  JWT_SECRET
};
