/**
 * StudyVerse Backend Server
 * Main entry point for the API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db/database');
const { authenticate, generateToken } = require('./middleware/auth');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3001;

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
        const existingUser = db.findByField('users', 'email', email);
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = db.create('users', {
            email,
            password: hashedPassword,
            name
        });

        const { password: _, ...userWithoutPassword } = user;
        const token = generateToken(user);

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

        const user = db.findByField('users', 'email', email);
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const { password: _, ...userWithoutPassword } = user;
        const token = generateToken(user);

        res.json({
            success: true,
            data: { user: userWithoutPassword, token }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Protected routes
app.get('/api/user/profile', authenticate, (req, res) => {
    const user = db.findById('users', req.user.userId);
    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
});

// Study streaks
app.get('/api/streaks', authenticate, (req, res) => {
    const streaks = db.findAllByField('study_streaks', 'user_id', req.user.userId);
    res.json({ success: true, data: streaks });
});

app.post('/api/streaks', authenticate, (req, res) => {
    const streak = db.create('study_streaks', {
        user_id: req.user.userId,
        ...req.body
    });
    res.status(201).json({ success: true, data: streak });
});

// Activity logs
app.get('/api/activities', authenticate, (req, res) => {
    const activities = db.findAllByField('activity_logs', 'user_id', req.user.userId);
    res.json({ success: true, data: activities });
});

app.post('/api/activities', authenticate, (req, res) => {
    const activity = db.create('activity_logs', {
        user_id: req.user.userId,
        ...req.body
    });
    res.status(201).json({ success: true, data: activity });
});

// Start server
app.listen(PORT, () => {
    console.log(`StudyVerse API running on http://localhost:${PORT}`);
});
