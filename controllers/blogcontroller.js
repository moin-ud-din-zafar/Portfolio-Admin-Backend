// src/controllers/blogcontroller.js
const Blog   = require('../models/Blog');
const multer = require('multer');
const path   = require('path');

// ——— Multer setup — store uploads in /uploads with a timestamped filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `feature-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage }).single('file');

/**
 * POST /api/blogroutes/
 * Creates a new blog post with an uploaded image.
 */
exports.createWithImage = [
  // 1. Run multer middleware
  (req, res, next) => {
    upload(req, res, err => {
      if (err instanceof multer.MulterError) {
        // Multer-specific errors
        return res.status(400).json({ error: 'Upload error', details: err.message });
      } else if (err) {
        // Unknown errors
        return res.status(500).json({ error: 'Server error during file upload' });
      }
      next();
    });
  },

  // 2. Controller logic
  async (req, res) => {
    // Validate presence of file
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    // Parse tags (JSON string or comma-separated)
    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch {
        tags = req.body.tags.split(',').map(t => t.trim());
      }
    }

    const { title, excerpt, content, publishDate } = req.body;

    // Basic field validation
    if (!title || !excerpt || !content || !publishDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Compute read time (@ ~200 wpm)
    const wordCount = content.trim().split(/\s+/).length;
    const readTime  = `${Math.ceil(wordCount / 200)} min read`;

    // Prepare new blog data
    const newBlogData = {
      title,
      excerpt,
      content,
      tags,
      publishDate: new Date(publishDate),
      imageUrl: `/uploads/${req.file.filename}`,
      readTime,
      likes: 0,
      comments: 0
    };

    try {
      const newBlog = new Blog(newBlogData);
      const saved   = await newBlog.save();
      return res.status(201).json(saved);
    } catch (err) {
      // Mongoose validation errors
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: 'Validation failed', details: messages });
      }
      console.error('Error saving blog:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
];

/**
 * GET /api/blogroutes/
 * Returns all blog posts, sorted by publishDate descending.
 */
exports.getAll = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ publishDate: -1 })
      .select('-__v');
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/blogroutes/:id
 * Returns a single blog post by ID.
 */
exports.getOne = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).select('-__v');
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(blog);
  } catch (err) {
    console.error(`Error fetching blog ${req.params.id}:`, err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * PUT /api/blogroutes/:id
 * Updates a blog post's fields; recalculates readTime if content changed.
 */
exports.update = async (req, res) => {
  const updates = { ...req.body };

  if (updates.content) {
    const wordCount = updates.content.trim().split(/\s+/).length;
    updates.readTime = `${Math.ceil(wordCount / 200)} min read`;
  }

  try {
    const updated = await Blog.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updated) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error(`Error updating blog ${req.params.id}:`, err);
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details: msgs });
    }
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * DELETE /api/blogroutes/:id
 * Deletes a blog post by ID.
 */
exports.remove = async (req, res) => {
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error(`Error deleting blog ${req.params.id}:`, err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
