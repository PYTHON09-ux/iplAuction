const express = require('express');
const router = express.Router();
const AuctionEvent = require('../models/AuctionEvent');
const Team = require('../models/Team');
const Player = require('../models/Player');
const AuctionSession = require('../models/AuctionSession');
const auth = require('../middleware/auth');
const { uploadAuction, cloudinary } = require('../middleware/cloudinary');

// GET all auction events (public list)
router.get('/', async (req, res) => {
  try {
    const events = await AuctionEvent.find().sort('-createdAt')
      .populate('teams', 'name shortName color logo')
      .select('-__v');
    res.json(events);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── IMPORTANT: specific routes BEFORE /:id wildcard ──────────────────────────

// GET viewer live data for an event (public - matched by /TOKEN/live)
router.get('/:token/live', async (req, res) => {
  try {
    const token = req.params.token.toUpperCase();
    const event = await AuctionEvent.findOne({ viewerToken: token });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Run team + player + session queries in parallel, but stats AFTER players resolve
    const [teams, players, currentSession, history] = await Promise.all([
      Team.find({ auctionEvent: event._id })
        .populate('players', 'name role soldPrice imageUrl'),
      Player.find({ auctionEvent: event._id })
        .populate('team', 'name shortName color logo'),
      AuctionSession.findOne({ auctionEvent: event._id, status: { $in: ['Active', 'Paused'] } })
        .populate('player')
        .populate('currentBidTeam', 'name shortName color logo'),
      AuctionSession.find({ auctionEvent: event._id, status: { $in: ['Sold', 'Unsold'] } })
        .populate('player', 'name role imageUrl')
        .populate('currentBidTeam', 'name shortName color logo')
        .sort('-endTime')
        .limit(20),
    ]);

    // Stats computed after players array is resolved
    const stats = {
      total: players.length,
      sold: players.filter(p => p.status === 'Sold').length,
      unsold: players.filter(p => p.status === 'Unsold').length,
      available: players.filter(p => p.status === 'Available').length,
    };

    res.json({
      event: {
        name: event.name,
        season: event.season,
        logo: event.logo,
        status: event.status,
        viewerToken: event.viewerToken,
      },
      teams,
      players,
      currentSession,
      history,
      stats,
    });
  } catch (err) {
    console.error('Live route error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single event by ID or viewerToken (public) — wildcard, must be AFTER /live
router.get('/:idOrToken', async (req, res) => {
  try {
    const { idOrToken } = req.params;
    let event = await AuctionEvent.findById(idOrToken).catch(() => null);
    if (!event) event = await AuctionEvent.findOne({ viewerToken: idOrToken.toUpperCase() });
    if (!event) return res.status(404).json({ error: 'Auction not found' });
    await event.populate(['teams', 'players']);
    res.json(event);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create auction event (admin only)
router.post('/', auth, uploadAuction.single('logo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) { data.logo = req.file.path; }
    const event = new AuctionEvent({ ...data, createdBy: req.admin.id });
    await event.save();
    res.status(201).json(event);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT update event (admin only)
router.put('/:id', auth, uploadAuction.single('logo'), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) { data.logo = req.file.path; }
    const event = await AuctionEvent.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE event (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await AuctionEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    await Player.updateMany({ auctionEvent: event._id }, { status: 'Available', soldPrice: null, team: null, auctionEvent: null });
    await Team.deleteMany({ auctionEvent: event._id });
    await AuctionSession.deleteMany({ auctionEvent: event._id });
    await event.deleteOne();
    res.json({ message: 'Event deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST add team to event (admin only)
router.post('/:id/teams', auth, async (req, res) => {
  try {
    const event = await AuctionEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const budget = Number(req.body.budget) || event.defaultTeamBudget;
    const team = new Team({ ...req.body, auctionEvent: event._id, budget, remainingBudget: budget });
    await team.save();
    event.teams.push(team._id);
    await event.save();
    res.status(201).json(team);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST add player to event (admin only)
router.post('/:id/players', auth, async (req, res) => {
  try {
    const event = await AuctionEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const player = new Player({ ...req.body, auctionEvent: event._id, basePrice: req.body.basePrice || event.defaultBasePrice });
    await player.save();
    event.players.push(player._id);
    await event.save();
    res.status(201).json(player);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;