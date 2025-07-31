// controllers/blogcontroller.js
const Blog   = require('../models/Blog');
const multer = require('multer');
const path   = require('path');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `feature-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage }).single('file');

// Create with image
exports.createWithImage = [
  (req, res, next) => {
    upload(req, res, err => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: 'Upload error', details: err.message });
      } else if (err) {
        return res.status(500).json({ error: 'Server error during file upload' });
      }
      next();
    });
  },
  async (req, res, next) => {
    console.log('→ [createWithImage] payload:', {
      file: req.file?.filename,
      body: req.body
    });

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    let tags = [];
    if (req.body.tags) {
      try {
        tags = JSON.parse(req.body.tags);
      } catch {
        tags = req.body.tags.split(',').map(t => t.trim());
      }
    }

    const { title, excerpt, content, publishDate } = req.body;
    if (!title || !excerpt || !content || !publishDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const wordCount = content.trim().split(/\s+/).length;
    const readTime  = `${Math.ceil(wordCount / 200)} min read`;

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
      console.log('→ [createWithImage] saved blog ID:', saved._id);
      res.status(201).json(saved);
    } catch (err) {
      if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ error: 'Validation failed', details: messages });
      }
      console.error('!! [createWithImage] error saving:', err);
      next(err);
    }
  }
];

// GET all
exports.getAll = async (req, res, next) => {
  console.log('→ [getAll] fetching all blogs');
  try {
    const blogs = await Blog.find()
      .sort({ publishDate: -1 })
      .select('-__v');
    console.log('→ [getAll] count:', blogs.length);
    res.status(200).json(blogs);
  } catch (err) {
    console.error('!! [getAll] error fetching:', err);
    next(err);
  }
};

// GET one
exports.getOne = async (req, res, next) => {
  console.log(`→ [getOne] fetching blog ID ${req.params.id}`);
  try {
    const blog = await Blog.findById(req.params.id).select('-__v');
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.status(200).json(blog);
  } catch (err) {
    console.error(`!! [getOne] error for ID ${req.params.id}:`, err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }
    next(err);
  }
};

// UPDATE
exports.update = async (req, res, next) => {
  console.log(`→ [update] ID ${req.params.id} payload:`, req.body);
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
    console.log(`→ [update] updated ID ${req.params.id}`);
    res.status(200).json(updated);
  } catch (err) {
    console.error(`!! [update] error ID ${req.params.id}:`, err);
    if (err.name === 'ValidationError') {
      const msgs = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details: msgs });
    }
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }
    next(err);
  }
};

// DELETE
exports.remove = async (req, res, next) => {
  console.log(`→ [remove] deleting ID ${req.params.id}`);
  try {
    const deleted = await Blog.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    console.log(`→ [remove] deleted ID ${req.params.id}`);
    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (err) {
    console.error(`!! [remove] error ID ${req.params.id}:`, err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid blog ID' });
    }
    next(err);
  }
};
