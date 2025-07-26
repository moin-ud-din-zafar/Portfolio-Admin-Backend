// src/controllers/projectcontroller.js
const Project = require('../models/Project');
const multer  = require('multer');
const path    = require('path');

// — Multer setup for `image` field
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `project-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage }).single('image');


// GET /api/projectroutes/
exports.getAll = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// POST /api/projectroutes/  (with optional image upload)
exports.create = [
  upload,  // parse multipart/form-data first
  async (req, res) => {
    // 1) Parse stats: either req.body.stats as string or object
    let stats = {};
    if (req.body.stats) {
      if (typeof req.body.stats === 'string') {
        try {
          stats = JSON.parse(req.body.stats);
        } catch (e) {
          return res.status(400).json({ error: 'Invalid stats JSON' });
        }
      } else {
        stats = req.body.stats;
      }
    }

    // 2) Required‐field check
    if (
      !req.body.title ||
      !req.body.description ||
      !stats.users ||
      !stats.performance ||
      !stats.rating
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 3) Build the project payload
    const data = {
      title:       req.body.title,
      description: req.body.description,
      image:       req.file ? `/uploads/${req.file.filename}` : '',
      tags:        Array.isArray(req.body.tags)
                     ? req.body.tags
                     : req.body.tags
                       ? req.body.tags.split(',').map(t => t.trim())
                       : [],
      demoUrl:     req.body.demoUrl || '',
      codeUrl:     req.body.codeUrl || '',
      featured:    req.body.featured === 'true' || req.body.featured === true,
      stats       // already validated above
    };

    // 4) Save and handle errors
    try {
      const proj  = new Project(data);
      const saved = await proj.save();
      res.status(201).json(saved);

    } catch (err) {
      if (err.name === 'ValidationError') {
        return res
          .status(400)
          .json({ error: 'Validation failed', details: err.message });
      }
      console.error('Error creating project:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
];


// PUT /api/projectroutes/:id
exports.update = async (req, res) => {
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


// DELETE /api/projectroutes/:id
exports.remove = async (req, res) => {
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
