const express = require('express');
const { authenticate, authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Example admin route
router.get('/admin/dashboard', authenticate, authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the admin dashboard!'
  });
});

router.get('/admin/users', authenticate, authenticateAdmin, async (req, res) => {
  const users = await db.findAll('users'); // Fetch all users from the database
  res.json({
    success: true,
    users
  });
});

module.exports = router;