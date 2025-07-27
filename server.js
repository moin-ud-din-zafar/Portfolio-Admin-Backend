// server.js
require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');

const blogRoutes    = require('./routes/blogroutes');
const projectRoutes = require('./routes/projectroutes');
const messageRoutes = require('./routes/messageroutes');

const app = express();

// — CORS: only allow your Vercel front‑end —
const FRONTEND_URL = 'https://portfolio-admin-frontend-alpha.vercel.app';
app.use(cors({
  origin: FRONTEND_URL,      // only this exact origin
  credentials: true,         // if you use cookies/auth
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health check
app.get('/', (req, res) => res.json({ message: '🚀 Backend up!' }));

// Routers
[
  { path: '/blogs',    router: blogRoutes    },
  { path: '/projects', router: projectRoutes },
  { path: '/messages', router: messageRoutes }
].forEach(({ path, router }) => {
  app.use(path, router);
  app.use(`/api${path}`, router);
});

// 404 & error handlers
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Server start / export
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Listening on ${PORT}`));
}
