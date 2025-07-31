require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const blogRoutes    = require('./routes/blogroutes');
const projectRoutes = require('./routes/projectroutes');
const messageRoutes = require('./routes/messageroutes');

const app = express();

// Log every request
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// CORS
const FRONTEND_URL = 'https://portfolio-admin-frontend-alpha.vercel.app';
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health-checks
app.get('/',   (req, res) => res.json({ message: 'Root up!' }));
app.get('/api', (req, res) => res.json({ message: 'API up!' }));

// ── MOUNT BLOG ROUTES BOTH WAYS ──
app.use('/blogs',    blogRoutes);
app.use('/api/blogs', blogRoutes);

// Mount the others however you like
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);

// 404 & error handlers
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export & start
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Listening on ${PORT}`));
}
