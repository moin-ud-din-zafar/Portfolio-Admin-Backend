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

// CORS whitelist
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS Block: ${origin}`));
    }
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
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
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// —— ROOT ping endpoint — so GET / won’t 404 ——
app.get('/', (req, res) => {
  res.json({ message: '🚀 Portfolio Admin Backend is up!' });
});

// —— MOUNT YOUR ROUTES ——
// we mount each router twice: once under /api/... (unchanged) and once
// under its bare path, in case the frontend is hitting e.g. `/projectroutes`
[
  { path: '/blogroutes',    router: blogRoutes    },
  { path: '/projectroutes', router: projectRoutes },
  { path: '/messageroutes', router: messageRoutes }
].forEach(({ path, router }) => {
  app.use(path, router);
  app.use(`/api${path}`, router);
});

// Fallbacks
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message || err);
  if (err.message && err.message.startsWith('CORS Block')) {
    return res.status(401).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel, but still allow `node server.js` locally
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on ${PORT}`));
}
