// models/Blog.js
const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    excerpt:     { type: String, required: true },
    content:     { type: String, required: true },
    tags:        [{ type: String }],
    publishDate: { type: Date,   required: true },
    imageUrl:    { type: String },
    readTime:    { type: String },
    likes:       { type: Number, default: 0 },
    comments:    { type: Number, default: 0 }
  },
  {
    timestamps: true // adds createdAt & updatedAt
  }
);

module.exports = mongoose.model('Blog', blogSchema);
