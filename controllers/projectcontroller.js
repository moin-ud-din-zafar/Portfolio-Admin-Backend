// controllers/projectcontroller.js
const Project    = require('../models/Project');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary (reuse same env vars as blogs)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /api/projects
exports.getAll = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/projects  (with optional image upload)
exports.create = async (req, res) => {
  console.log('→ [projects.create] req.body:', req.body);
  console.log('→ [projects.create] req.files:', req.files);

  // 1) Upload image to Cloudinary if provided
  let imageUrl = '';
  if (req.files && req.files.image) {
    try {
      const uploadRes = await cloudinary.uploader.upload(
        req.files.image.tempFilePath,
        { folder: 'project-images', resource_type: 'image' }
      );
      imageUrl = uploadRes.secure_url;
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      return res.status(500).json({ error: 'Server error during file upload' });
    }
  }

  // 2) Parse stats
  let stats = {};
  if (req.body.stats) {
    if (typeof req.body.stats === 'string') {
      try {
        stats = JSON.parse(req.body.stats);
      } catch {
        return res.status(400).json({ error: 'Invalid stats JSON' });
      }
    } else {
      stats = req.body.stats;
    }
  }

  // 3) Validate required fields
  if (
    !req.body.title ||
    !req.body.description ||
    !stats.users ||
    !stats.performance ||
    !stats.rating
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 4) Build data payload
  const data = {
    title:       req.body.title,
    description: req.body.description,
    image:       imageUrl,   // ← now from Cloudinary
    tags:        Array.isArray(req.body.tags)
                     ? req.body.tags
                     : req.body.tags
                       ? req.body.tags.split(',').map(t => t.trim()).filter(Boolean)
                       : [],
    demoUrl:     req.body.demoUrl || '',
    codeUrl:     req.body.codeUrl || '',
    featured:    req.body.featured === 'true' || req.body.featured === true,
    stats,      // parsed above
  };

  // 5) Save and respond
  try {
    const proj  = new Project(data);
    const saved = await proj.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error creating project:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/projects/:id
exports.update = async (req, res) => {
  console.log(`→ [projects.update] ID ${req.params.id}`, req.body);

  try {
    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(updated);
  } catch (err) {
    console.error(`Error updating project ${req.params.id}:`, err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation failed', details: err.message });
    }
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /api/projects/:id
exports.remove = async (req, res) => {
  console.log(`→ [projects.remove] ID ${req.params.id}`);
  try {
    const deleted = await Project.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    console.error(`Error deleting project ${req.params.id}:`, err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};
