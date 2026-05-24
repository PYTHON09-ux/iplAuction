const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const auth = require('../middleware/auth');
const { uploadPlayer, cloudinary } = require('../middleware/cloudinary');

// GET all players (public)
router.get('/', async (req, res) => {
  try {
    const { status, role, team, auctionEvent } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (team) filter.team = team;
    if (auctionEvent) filter.auctionEvent = auctionEvent;
    const players = await Player.find(filter).populate('team', 'name shortName color logo').sort('auctionOrder name');
    res.json(players);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single player (public)
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).populate('team');
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create player with optional image (admin only)
router.post('/', auth, uploadPlayer.single('image'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.body.stats) data.stats = typeof req.body.stats === 'string' ? JSON.parse(req.body.stats) : req.body.stats;
    if (req.file) { data.imageUrl = req.file.path; data.imagePublicId = req.file.filename; }
    const player = new Player(data);
    await player.save();
    res.status(201).json(player);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update player (admin only)
router.put('/:id', auth, uploadPlayer.single('image'), async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    const data = { ...req.body };
    if (req.body.stats) data.stats = typeof req.body.stats === 'string' ? JSON.parse(req.body.stats) : req.body.stats;
    if (req.file) {
      if (player.imagePublicId) await cloudinary.uploader.destroy(player.imagePublicId).catch(() => {});
      data.imageUrl = req.file.path;
      data.imagePublicId = req.file.filename;
    }
    const updated = await Player.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }).populate('team', 'name shortName color');
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE player (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (player.imagePublicId) await cloudinary.uploader.destroy(player.imagePublicId).catch(() => {});
    await player.deleteOne();
    res.json({ message: 'Player deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT reset player to available (admin only)
router.put('/:id/reset', auth, async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    player.status = 'Available'; player.soldPrice = null; player.team = null;
    await player.save();
    res.json(player);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
