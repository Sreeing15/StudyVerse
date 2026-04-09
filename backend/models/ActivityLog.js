const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ActivityLogSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4
  },
  user_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  strict: false, // allow flexible schema for arbitrary req.body data
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

ActivityLogSchema.virtual('id').get(function() {
  return this._id;
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
