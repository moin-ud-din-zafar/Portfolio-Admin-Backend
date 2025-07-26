// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: /\S+@\S+\.\S+/
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    minlength: 5
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10
  }
}, {
  timestamps: { createdAt: 'receivedAt' }
});

module.exports = mongoose.model('Message', messageSchema);