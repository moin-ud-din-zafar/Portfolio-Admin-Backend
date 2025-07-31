const Project    = require('../models/Project');
const cloudinary = require('cloudinary').v2;

// Cloudinary config (reuse env)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// POST /api/projects
exports.create = async (req, res) => {
  try {
    // 1) Upload image
    let image = '';
    if (req.files?.image) {
      const r = await cloudinary.uploader.upload(
        req.files.image.tempFilePath,
        { folder: 'projects', resource_type: 'image' }
      );
      image = r.secure_url;
    }

    // 2) Parse stats
    let stats = {};
    if (req.body.stats) {
      stats = typeof req.body.stats === 'string'
        ? JSON.parse(req.body.stats)
        : req.body.stats;
    }

    // 3) Validate
    const { title, description, demoUrl, codeUrl, featured, tags } = req.body;
    if (!title || !description || !stats.users || !stats.performance || !stats.rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 4) Build & save
    const p = new Project({
      title, description, image,
      tags: Array.isArray(tags)
        ? tags
        : tags
          ? tags.split(',').map(t => t.trim())
          : [],
      demoUrl: demoUrl || '',
      codeUrl: codeUrl || '',
      featured: featured==='true'||featured===true,
      stats
    });
    const saved = await p.save();
    res.status(201).json(saved);

  } catch (err) {
    console.error('createProject ERROR:', err.stack || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/projects
exports.getAll = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('getAllProjects ERROR:', err.stack || err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/projects/:id
exports.getOne = async (req, res) => {
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) {
    console.error('getOneProject ERROR:', err.stack || err);
    res.status(400).json({ error: 'Invalid ID' });
  }
};

// PUT /api/projects/:id
exports.update = async (req, res) => {
  try {
    const u = await Project.findByIdAndUpdate(
      req.params.id, req.body,
      { new: true, runValidators: true }
    );
    if (!u) return res.status(404).json({ error: 'Not found' });
    res.json(u);
  } catch (err) {
    console.error('updateProject ERROR:', err.stack || err);
    res.status(400).json({ error: 'Invalid data or ID' });
  }
};

// DELETE /api/projects/:id
exports.remove = async (req, res) => {
  try {
    const d = await Project.findByIdAndDelete(req.params.id);
    if (!d) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteProject ERROR:', err.stack || err);
    res.status(400).json({ error: 'Invalid ID' });
  }
};
