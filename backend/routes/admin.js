const express = require('express');
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const db = require('../db/database');

const router = express.Router();

// Example admin route
router.get('/admin/dashboard', authenticate, authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the admin dashboard!'
  });
});

router.get('/admin/users', authenticate, authenticateAdmin, async (req, res) => {
  const users = db.findAll('users'); // Fetch all users from the database
  // Don't send passwords
  const safeUsers = users.map(({ password, ...user }) => user);
  res.json({
    success: true,
    users: safeUsers
  });
});

router.delete('/admin/users/:id', authenticate, authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const success = db.delete('users', userId);
    
    if (!success) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;