const express = require('express');
const cors = require('cors');
const path = require('node:path');

const authRoutes = require('./routes/authRoutes');
const achievementRoutes = require('./routes/achievementRoutes');
const adminRoutes = require('./routes/adminRoutes');
const profileRoutes = require('./routes/profileRoutes');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : '*';

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({ message: 'Unifolio - AI Powered Cetralized System API is running' });
});

app.use('/api', authRoutes);
app.use('/api', achievementRoutes);
app.use('/api', adminRoutes);
app.use('/api', profileRoutes);

app.use((err, req, res, next) => {
  if (!err) {
    next();
    return;
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File size limit exceeded (max 5MB)' });
  }

  return res.status(400).json({ message: err.message || 'Request failed' });
});

module.exports = app;
