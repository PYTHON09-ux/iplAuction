const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/events', require('../routes/events'));
app.use('/api/players', require('../routes/players'));
app.use('/api/teams', require('../routes/teams'));
app.use('/api/auction', require('../routes/auction'));
app.use('/api/seed', require('../routes/seed'));

// Health Check
app.get('/', (req, res) => {
  res.send('IPL Auction API Running');
});

// Export for Vercel
module.exports = app;