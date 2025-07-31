require('dotenv').config();
const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const path         = require('path');
const fileUpload   = require('express-fileupload');

const blogRoutes    = require('./routes/blogroutes');
const projectRoutes = require('./routes/projectroutes');
const messageRoutes = require('./routes/messageroutes');

const app = express();

// 1) Logging
app.use((req, res, next) => {
  console.log(`→ ${req.method} ${req.originalUrl}`);
  next();
});

// 2) CORS
app.use(cors({ origin: true, credentials: true }));

// 3) Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4) File-upload (for Cloudinary temp files)
app.use(fileUpload({
  useTempFiles:     true,
  tempFileDir:      '/tmp/',
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 },
}));

// 5) Static serve (legacy/dev only)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 6) MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// 7) Health-check
app.get('/',    (req, res) => res.json({ message: 'Root up!!!' }));
app.get('/api', (req, res) => res.json({ message: 'API up!!!' }));

// 8) Mount under /api
app.use('/api/blogs',    blogRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/messages', messageRoutes);

// 9) 404 & error handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack || err);
  res.status(500).json({ error: 'Internal server error' });
});

// 10) Start
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Listening on ${PORT}`));
}
module.exports = app;
