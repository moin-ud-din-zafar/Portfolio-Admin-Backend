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

// — ALLOW CORS FOR EVERY ORIGIN —
// Sends `Access-Control-Allow-Origin: *` on all responses
app.use(cors());

// If you later need cookies/auth, switch to:
// app.use(cors({ origin: true, credentials: true }));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health‑check endpoint
app.get('/', (req, res) => {
  res.json({ message: '🚀 Portfolio Admin Backend is up!' });
});

// Mount your routers under both /<route> and /api/<route>
[
  { path: '/blogroutes',    router: blogRoutes    },
  { path: '/projectroutes', router: projectRoutes },
  { path: '/messageroutes', router: messageRoutes }
].forEach(({ path, router }) => {
  app.use(path, router);
  app.use(`/api${path}`, router);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel; also support `node server.js` locally
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
}
