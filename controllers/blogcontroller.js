const Blog       = require('../models/Blog');
const cloudinary = require('cloudinary').v2;

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/blogs
exports.createWithImage = async (req, res) => {
  try {
    // 1) Upload image
    let imageUrl = '';
    if (req.files?.file) {
      const r = await cloudinary.uploader.upload(
        req.files.file.tempFilePath,
        { folder: 'blogs', resource_type: 'image' }
      );
      imageUrl = r.secure_url;
    }

    // 2) Parse tags
    let tags = [];
    if (req.body.tags) {
      try { tags = JSON.parse(req.body.tags); }
      catch { tags = req.body.tags.split(',').map(t => t.trim()); }
    }

    // 3) Validate required
    const { title, excerpt, content, publishDate } = req.body;
    if (!title || !excerpt || !content || !publishDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 4) Compute readTime
    const wc = content.trim().split(/\s+/).length;
    const readTime = `${Math.ceil(wc/200)} min read`;

    // 5) Save
    const b = new Blog({
      title, excerpt, content, tags,
      publishDate: new Date(publishDate),
      imageUrl, readTime, likes: 0, comments: 0
    });
    const saved = await b.save();
    res.status(201).json(saved);

  } catch (err) {
    console.error('createWithImage ERROR:', err.stack || err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(err.errors).map(e => e.message)
      });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/blogs
exports.getAll = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ publishDate: -1 }).select('-__v');
    res.json(blogs);
  } catch (err) {
    console.error('getAll ERROR:', err.stack || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/blogs/:id
exports.getOne = async (req, res) => {
  try {
    const b = await Blog.findById(req.params.id).select('-__v');
    if (!b) return res.status(404).json({ error: 'Not found' });
    res.json(b);
  } catch (err) {
    console.error('getOne ERROR:', err.stack || err);
    res.status(400).json({ error: 'Invalid ID' });
  }
};

// PUT /api/blogs/:id
exports.update = async (req, res) => {
  try {
    const upd = { ...req.body };
    if (upd.content) {
      const wc = upd.content.trim().split(/\s+/).length;
      upd.readTime = `${Math.ceil(wc/200)} min read`;
    }
    const b = await Blog.findByIdAndUpdate(
      req.params.id, upd,
      { new: true, runValidators: true }
    ).select('-__v');
    if (!b) return res.status(404).json({ error: 'Not found' });
    res.json(b);
  } catch (err) {
    console.error('update ERROR:', err.stack || err);
    res.status(400).json({ error: 'Invalid data or ID' });
  }
};

// DELETE /api/blogs/:id
exports.remove = async (req, res) => {
  try {
    const d = await Blog.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('remove ERROR:', err.stack || err);
    res.status(400).json({ error: 'Invalid ID' });
  }
};
