/**
 * StudyVerse Database Module
 * Uses MongoDB via Mongoose
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const StudyStreak = require('../models/StudyStreak');
const ActivityLog = require('../models/ActivityLog');

const autoMigrate = async () => {
  const dbPath = path.join(__dirname, 'data.json');
  if (!fs.existsSync(dbPath)) {
    return; // Migration already complete or not needed
  }

  console.log('Detected data.json! Auto-migrating data to MongoDB...');
  
  try {
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    if (data.users && data.users.length > 0) {
      for (const user of data.users) {
        const existing = await User.findById(user.id);
        if (!existing) {
          const newUser = { ...user, _id: user.id };
          delete newUser.id;
          await User.create(newUser);
        }
      }
      console.log(`Migrated ${data.users.length} users.`);
    }

    if (data.study_streaks && data.study_streaks.length > 0) {
      for (const streak of data.study_streaks) {
        const newStreak = { ...streak, _id: streak.id || streak._id };
        delete newStreak.id;
        await StudyStreak.create(newStreak);
      }
      console.log(`Migrated ${data.study_streaks.length} study streaks.`);
    }

    if (data.activity_logs && data.activity_logs.length > 0) {
      for (const log of data.activity_logs) {
        const newLog = { ...log, _id: log.id || log._id };
        delete newLog.id;
        await ActivityLog.create(newLog);
      }
      console.log(`Migrated ${data.activity_logs.length} activity logs.`);
    }

    // After successful migration, remove the file
    fs.unlinkSync(dbPath);
    console.log('data.json successfully migrated and removed!');
  } catch (err) {
    console.error('Auto-migration failed!', err);
  }
};

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('Error: MONGODB_URI is not defined in your .env file. Please create a MongoDB Atlas cluster and add the URI.');
      process.exit(1);
    }
    
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Automatically migrate data if data.json still exists
    await autoMigrate();
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
