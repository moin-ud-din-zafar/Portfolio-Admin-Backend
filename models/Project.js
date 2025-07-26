// src/models/Project.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const StatsSchema = new Schema({
  users:       { type: String, required: true },   // e.g. "10K+"
  performance: { type: String, required: true },   // e.g. "99.9%"
  rating:      { type: String, required: true }    // e.g. "4.9/5"
}, { _id: false });

const ProjectSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  image:       { type: String, default: '' },       // URL to the project image
  tags:        { type: [String], default: [] },     // e.g. ['React','Node.js']
  demoUrl:     { type: String, default: '' },
  codeUrl:     { type: String, default: '' },
  featured:    { type: Boolean, default: false },
  stats:       { type: StatsSchema, required: true }
}, {
  timestamps: true   // gives you createdAt & updatedAt
});

module.exports = mongoose.model('Project', ProjectSchema);
