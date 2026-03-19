/**
 * StudyVerse Database Module
 * Uses JSON file-based storage for demo purposes
 * In production, replace with better-sqlite3 or similar
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, 'data.json');

// Initialize database with default structure
const initializeDB = () => {
  const defaultData = {
    users: [],
    study_streaks: [],
    activity_logs: [],
    summaries: [],
    quizzes: [],
    schedules: [],
    scraped_context: []
  };
  
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData, null, 2));
  }
  return defaultData;
};

// Read database
const readDB = () => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return initializeDB();
    }
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return initializeDB();
  }
};

// Write database
const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing database:', error);
    return false;
  }
};

// Generic CRUD operations
const db = {
  // Create
  create: (table, data) => {
    const db = readDB();
    if (!db[table]) db[table] = [];
    
    const newItem = {
      id: uuidv4(),
      ...data,
      created_at: new Date().toISOString()
    };
    
    db[table].push(newItem);
    writeDB(db);
    return newItem;
  },

  // Read all
  findAll: (table) => {
    const db = readDB();
    return db[table] || [];
  },

  // Find by ID
  findById: (table, id) => {
    const db = readDB();
    return (db[table] || []).find(item => item.id === id);
  },

  // Find by field
  findByField: (table, field, value) => {
    const db = readDB();
    return (db[table] || []).find(item => item[field] === value);
  },

  // Find all by field
  findAllByField: (table, field, value) => {
    const db = readDB();
    return (db[table] || []).filter(item => item[field] === value);
  },

  // Update
  update: (table, id, data) => {
    const db = readDB();
    if (!db[table]) return null;
    
    const index = db[table].findIndex(item => item.id === id);
    if (index === -1) return null;
    
    db[table][index] = {
      ...db[table][index],
      ...data,
      updated_at: new Date().toISOString()
    };
    
    writeDB(db);
    return db[table][index];
  },

  // Delete
  delete: (table, id) => {
    const db = readDB();
    if (!db[table]) return false;
    
    const index = db[table].findIndex(item => item.id === id);
    if (index === -1) return false;
    
    db[table].splice(index, 1);
    writeDB(db);
    return true;
  },

  // Query with filter function
  query: (table, filterFn) => {
    const db = readDB();
    return (db[table] || []).filter(filterFn);
  }
};

module.exports = db;
