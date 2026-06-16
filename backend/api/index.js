const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',  // add || '*' as fallback
  credentials: true,
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/auth',    require('../routes/auth'));
app.use('/api/events',  require('../routes/events'));
app.use('/api/players', require('../routes/players'));
app.use('/api/teams',   require('../routes/teams'));
app.use('/api/auction', require('../routes/auction'));
app.use('/api/seed',    require('../routes/seed'));

app.get('/', (req, res) => res.send('IPL Auction API Running'));

module.exports = app;  // no app.listen here