const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const Player = require('../models/Player');
const auth = require('../middleware/auth');
const { uploadTeam, cloudinary } = require('../middleware/cloudinary');

// GET all teams (public)
router.get('/', async (req, res) => {
  try {
    const { auctionEvent } = req.query;
    const filter = auctionEvent ? { auctionEvent } : {};
    const teams = await Team.find(filter).populate('players', 'name role soldPrice status imageUrl');
    res.json(teams);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single team (public)
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('players');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create team with optional logo (admin only)
router.post('/', auth, uploadTeam.single('logo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) { data.logo = req.file.path; data.logoPublicId = req.file.filename; }
    const team = new Team(data);
    await team.save();
    res.status(201).json(team);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update team (admin only)
router.put('/:id', auth, uploadTeam.single('logo'), async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const data = { ...req.body };
    if (req.file) {
      if (team.logoPublicId) await cloudinary.uploader.destroy(team.logoPublicId).catch(() => {});
      data.logo = req.file.path; data.logoPublicId = req.file.filename;
    }
    const updated = await Team.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE team (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    if (team.logoPublicId) await cloudinary.uploader.destroy(team.logoPublicId).catch(() => {});
    await Player.updateMany({ team: team._id }, { team: null, status: 'Available', soldPrice: null });
    await team.deleteOne();
    res.json({ message: 'Team deleted and players reset' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
