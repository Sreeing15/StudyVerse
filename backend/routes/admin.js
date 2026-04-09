const express = require('express');
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Example admin route
router.get('/admin/dashboard', authenticate, authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the admin dashboard!'
  });
});

router.get('/admin/users', authenticate, authenticateAdmin, async (req, res) => {
  try {
    const users = await User.find({});
    // Don't send passwords
    const safeUsers = users.map(user => {
      const userObj = user.toJSON();
      const { password, ...safeUser } = userObj;
      return safeUser;
    });
    
    res.json({
      success: true,
      users: safeUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/admin/users/:id', authenticate, authenticateAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;