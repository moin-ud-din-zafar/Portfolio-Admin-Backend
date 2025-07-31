require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const blogRoutes    = require('./routes/blogroutes');
const projectRoutes = require('./routes/projectroutes');
const messageRoutes = require('./routes/messageroutes');

const app = express();

// — CORS
const FRONTEND_URL = 'https://portfolio-admin-frontend-alpha.vercel.app';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// — Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// — Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// — MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// — Health-check on /api
app.get('/api', (req, res) => res.json({ message: 'API up!' }));

// — Mount all of your API routers under /api/*
app.use('/api/blogs',    blogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);

// — 404 & error handlers
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// — Server start / export
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Listening on ${PORT}`));
}
