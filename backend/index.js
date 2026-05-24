const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
console.log("Mongo URI:", MONGO_URI);
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/events',  require('./routes/events'));
app.use('/api/players', require('./routes/players'));
app.use('/api/teams',   require('./routes/teams'));
app.use('/api/auction', require('./routes/auction'));
app.use('/api/seed',    require('./routes/seed'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
