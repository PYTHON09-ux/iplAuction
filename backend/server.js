const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { attachChat } = require('./chatServer');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://ipl-auction-7xr4.vercel.app', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

app.use('/api/auth',    require('./routes/auth'));
app.use('/api/events',  require('./routes/events'));
app.use('/api/players', require('./routes/players'));
app.use('/api/teams',   require('./routes/teams'));
app.use('/api/auction', require('./routes/auction'));
app.use('/api/seed',    require('./routes/seed'));

app.get('/', (req, res) => res.send('IPL Auction API Running'));

const server = http.createServer(app);
attachChat(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));