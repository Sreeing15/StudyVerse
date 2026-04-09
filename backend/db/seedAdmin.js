require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

const createAdmin = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('Error: MONGODB_URI is not defined in your .env file.');
            process.exit(1);
        }
        
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@studyverse.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const existingAdmin = await User.findOne({ role: 'admin' });
        const existingEmailUser = await User.findOne({ email: adminEmail });

        if (existingAdmin || existingEmailUser) {
            console.log('Admin user already exists.');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await User.create({
            _id: uuidv4(),
            email: adminEmail,
            name: 'Admin',
            password: hashedPassword,
            role: 'admin'
        });

        console.log(`Admin created successfully with email: ${adminEmail}`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
