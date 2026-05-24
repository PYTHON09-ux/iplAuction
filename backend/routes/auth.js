const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const auth = require('../middleware/auth');

const sign = (admin) => jwt.sign(
  { id: admin._id, username: admin.username, name: admin.name },
  process.env.JWT_SECRET || 'dev_secret_change_me',
  { expiresIn: '7d' }
);

// POST /api/auth/setup — create first admin (only if none exists)
router.post('/setup', async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) return res.status(400).json({ error: 'Admin already exists. Use login.' });
    const { username, password, name } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const admin = new Admin({ username, password, name: name || 'Admin' });
    await admin.save();
    res.status(201).json({ message: 'Admin created', token: sign(admin), admin: { username: admin.username, name: admin.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await admin.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: sign(admin), admin: { username: admin.username, name: admin.name, id: admin._id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me — verify token and return profile
router.get('/me', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json(admin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/password — change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id);
    const ok = await admin.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ error: 'Current password is incorrect' });
    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/needs-setup
router.get('/needs-setup', async (req, res) => {
  const count = await Admin.countDocuments();
  res.json({ needsSetup: count === 0 });
});

module.exports = router;
