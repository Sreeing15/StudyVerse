/**
 * StudyVerse Backend Server
 * Main entry point for the API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db/database');
const { authenticate, generateToken } = require('./middleware/auth');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const StudyStreak = require('./models/StudyStreak');
const ActivityLog = require('./models/ActivityLog');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to StudyVerse API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            profile: 'GET /api/user/profile',
            streaks: 'GET /api/streaks',
            activities: 'GET /api/activities'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'StudyVerse API is running' });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            role: 'user'
        });

        // Convert Mongoose document to plain JSON with virtuals applied
        const userObj = user.toJSON();
        const { password: _, ...userWithoutPassword } = userObj;
        
        const token = generateToken(userObj);

        res.status(201).json({
            success: true,
            data: { user: userWithoutPassword, token }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const userObj = user.toJSON();
        const { password: _, ...userWithoutPassword } = userObj;
        const token = generateToken(userObj);

        res.json({
            success: true,
            data: { user: userWithoutPassword, token }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Protected routes
app.get('/api/user/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const userObj = user.toJSON();
        const { password, ...userWithoutPassword } = userObj;
        res.json({ success: true, data: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Study streaks
app.get('/api/streaks', authenticate, async (req, res) => {
    try {
        const streaks = await StudyStreak.find({ user_id: req.user.userId });
        res.json({ success: true, data: streaks });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/streaks', authenticate, async (req, res) => {
    try {
        const streak = await StudyStreak.create({
            user_id: req.user.userId,
            ...req.body
        });
        res.status(201).json({ success: true, data: streak });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Activity logs
app.get('/api/activities', authenticate, async (req, res) => {
    try {
        const activities = await ActivityLog.find({ user_id: req.user.userId });
        res.json({ success: true, data: activities });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/activities', authenticate, async (req, res) => {
    try {
        const activity = await ActivityLog.create({
            user_id: req.user.userId,
            ...req.body
        });
        res.status(201).json({ success: true, data: activity });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Admin routes
app.use('/api', require('./routes/admin'));

// Start server
app.listen(PORT, () => {
    console.log(`StudyVerse API running on http://localhost:${PORT}`);
});
