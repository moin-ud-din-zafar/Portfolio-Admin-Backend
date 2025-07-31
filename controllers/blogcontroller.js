// controllers/blogcontroller.js
const Blog      = require('../models/Blog');
const path      = require('path');
const cloudinary = require('cloudinary').v2;

// configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create with image (Cloudinary)
exports.createWithImage = async (req, res, next) => {
  console.log('→ [createWithImage] payload:', {
    files: Object.keys(req.files || {}),
    body: req.body,
  });

  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'Image file is required' });
  }
  const file = req.files.file;

  let uploadResult;
  try {
    uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'blog-images',
      resource_type: 'image',
    });
  } catch (err) {
    console.error('!! Cloudinary upload failed:', err);
    return res.status(500).json({ error: 'Server error during file upload' });
  }

  // parse tags
  let tags = [];
  if (req.body.tags) {
    try { tags = JSON.parse(req.body.tags); }
    catch { tags = req.body.tags.split(',').map(t => t.trim()).filter(Boolean); }
  }

  const { title, excerpt, content, publishDate } = req.body;
  if (!title || !excerpt || !content || !publishDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // compute readTime
  const wordCount = content.trim().split(/\s+/).length;
  const readTime  = `${Math.ceil(wordCount / 200)} min read`;

  const newBlogData = {
    title,
    excerpt,
    content,
    tags,
    publishDate: new Date(publishDate),
    imageUrl:    uploadResult.secure_url,
    readTime,
    likes:    0,
    comments: 0,
  };

  try {
    const saved = await new Blog(newBlogData).save();
    console.log('→ [createWithImage] saved blog ID:', saved._id);
    res.status(201).json(saved);
  } catch (err) {
    console.error('!! [createWithImage] DB save error:', err);
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details });
    }
    next(err);
  }
};

// GET all
exports.getAll = async (req, res, next) => {
  console.log('→ [getAll] fetching all blogs');
  try {
    const blogs = await Blog.find().sort({ publishDate: -1 }).select('-__v');
    console.log('→ [getAll] count:', blogs.length);
    res.status(200).json(blogs);
  } catch (err) {
    console.error('!! [getAll] error:', err);
    next(err);
  }
};

// GET one
exports.getOne = async (req, res, next) => {
  console.log(`→ [getOne] fetching ID ${req.params.id}`);
  try {
    const blog = await Blog.findById(req.params.id).select('-__v');
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.status(200).json(blog);
  } catch (err) {
    console.error(`!! [getOne] error ID ${req.params.id}:`, err);
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
    const wc = updates.content.trim().split(/\s+/).length;
    updates.readTime = `${Math.ceil(wc / 200)} min read`;
  }

  try {
    const updated = await Blog.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-__v');
    if (!updated) return res.status(404).json({ error: 'Blog not found' });
    console.log(`→ [update] updated ID ${req.params.id}`);
    res.status(200).json(updated);
  } catch (err) {
    console.error(`!! [update] error ID ${req.params.id}:`, err);
    if (err.name === 'ValidationError') {
      const details = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: 'Validation failed', details });
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
    if (!deleted) return res.status(404).json({ error: 'Blog not found' });
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
