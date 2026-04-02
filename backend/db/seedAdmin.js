require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');
const { v4: uuidv4 } = require('uuid');

const createAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@studyverse.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        const existingAdmin = db.findByField('users', 'role', 'admin');
        const existingEmailUser = db.findByField('users', 'email', adminEmail);

        if (existingAdmin || existingEmailUser) {
            console.log('Admin user already exists.');
            return;
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const database = require('fs').readFileSync(require('path').join(__dirname, 'data.json'), 'utf8');
        const parsedDB = JSON.parse(database);

        const newAdmin = {
            id: uuidv4(),
            email: adminEmail,
            name: 'Admin',
            password: hashedPassword,
            role: 'admin',
            created_at: new Date().toISOString()
        };

        if (!parsedDB.users) parsedDB.users = [];
        parsedDB.users.push(newAdmin);

        require('fs').writeFileSync(require('path').join(__dirname, 'data.json'), JSON.stringify(parsedDB, null, 2));

        console.log(`Admin created successfully with email: ${adminEmail}`);
    } catch (error) {
        console.error('Error creating admin:', error);
    }
};

createAdmin();
