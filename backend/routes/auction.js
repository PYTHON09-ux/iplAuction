const express = require('express');
const router = express.Router();
const AuctionSession = require('../models/AuctionSession');
const Player = require('../models/Player');
const Team = require('../models/Team');
const auth = require('../middleware/auth');

// GET current active auction session (public)
router.get('/current', async (req, res) => {
  try {
    const { auctionEvent } = req.query;
    const filter = { status: { $in: ['Active', 'Paused'] } };
    if (auctionEvent) filter.auctionEvent = auctionEvent;
    const session = await AuctionSession.findOne(filter)
      .populate('player').populate('currentBidTeam', 'name shortName color logo').sort('-createdAt');
    res.json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET history (public)
router.get('/history', async (req, res) => {
  try {
    const { auctionEvent } = req.query;
    const filter = { status: { $in: ['Sold', 'Unsold'] } };
    if (auctionEvent) filter.auctionEvent = auctionEvent;
    const sessions = await AuctionSession.find(filter)
      .populate('player', 'name role imageUrl').populate('currentBidTeam', 'name shortName color logo')
      .sort('-createdAt');
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET stats (public)
router.get('/stats', async (req, res) => {
  try {
    const { auctionEvent } = req.query;
    const filter = auctionEvent ? { auctionEvent } : {};
    const [total, sold, unsold, available, teams] = await Promise.all([
      Player.countDocuments(filter),
      Player.countDocuments({ ...filter, status: 'Sold' }),
      Player.countDocuments({ ...filter, status: 'Unsold' }),
      Player.countDocuments({ ...filter, status: 'Available' }),
      Team.find(filter),
    ]);
    const totalBudgetSpent = teams.reduce((s, t) => s + (t.budget - t.remainingBudget), 0);
    const highestSale = await Player.findOne({ ...filter, status: 'Sold' }).sort('-soldPrice').populate('team', 'name shortName color logo');
    res.json({ totalPlayers: total, soldPlayers: sold, unsoldPlayers: unsold, availablePlayers: available, totalBudgetSpent, highestSale, teamCount: teams.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST start auction (admin only)
router.post('/start', auth, async (req, res) => {
  try {
    const { playerId, auctionEvent } = req.body;
    const filter = { status: { $in: ['Active', 'Paused'] } };
    if (auctionEvent) filter.auctionEvent = auctionEvent;
    const existing = await AuctionSession.findOne(filter);
    if (existing) return res.status(400).json({ error: 'An auction is already active. Close it first.' });
    const player = await Player.findById(playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (player.status !== 'Available') return res.status(400).json({ error: 'Player is not available for auction' });
    const session = new AuctionSession({ player: playerId, auctionEvent: auctionEvent || null, currentBid: player.basePrice, basePrice: player.basePrice, status: 'Active' });
    await session.save();
    const populated = await session.populate('player');
    res.status(201).json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST place bid (admin only)
router.post('/bid', auth, async (req, res) => {
  try {
    const { sessionId, teamId, amount, defaultBasePrice } = req.body;

    const session = await AuctionSession.findById(sessionId).populate('auctionEvent');
    if (!session || session.status !== 'Active')
      return res.status(400).json({ error: 'No active auction session' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (amount <= session.currentBid)
      return res.status(400).json({ error: `Bid must be higher than ₹${session.currentBid.toLocaleString()}` });

    // Reserved-budget guard:
    // After winning this player, team still needs to fill (remainingSlots - 1) more slots.
    // Each of those slots requires at least defaultBasePrice, so that amount must stay reserved.
    const currentSlots   = team.maxPlayers - team.players.length;
    const slotsAfter     = currentSlots - 1;
    const basePrice      = session.auctionEvent?.defaultBasePrice ?? defaultBasePrice ?? 0;
    const reservedBudget = slotsAfter * basePrice;
    const effectiveMax   = team.remainingBudget - reservedBudget;

    if (amount > effectiveMax) {
      return res.status(400).json({
        error: `Max bid is ₹${effectiveMax.toLocaleString()}. Must reserve ₹${reservedBudget.toLocaleString()} for ${slotsAfter} remaining slot(s).`
      });
    }

    session.bids.push({ team: teamId, teamName: team.name, amount });
    session.currentBid = amount;
    session.currentBidTeam = teamId;
    session.currentBidTeamName = team.name;
    await session.save();

    const populated = await session.populate(['player', 'currentBidTeam']);
    res.json(populated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST mark SOLD (admin only)
router.post('/sold', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await AuctionSession.findById(sessionId);
    if (!session || session.status !== 'Active') return res.status(400).json({ error: 'No active session' });
    if (!session.currentBidTeam) return res.status(400).json({ error: 'No bids placed. Mark as Unsold instead.' });
    const [team, player] = await Promise.all([Team.findById(session.currentBidTeam), Player.findById(session.player)]);
    team.players.push(player._id); team.remainingBudget -= session.currentBid; await team.save();
    player.status = 'Sold'; player.soldPrice = session.currentBid; player.team = team._id; await player.save();
    session.status = 'Sold'; session.endTime = new Date(); await session.save();
    res.json({ session, player, team });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST mark UNSOLD (admin only)
router.post('/unsold', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await AuctionSession.findById(sessionId);
    if (!session || !['Active', 'Paused'].includes(session.status)) return res.status(400).json({ error: 'No active session' });
    const player = await Player.findById(session.player);
    player.status = 'Unsold'; await player.save();
    session.status = 'Unsold'; session.endTime = new Date(); await session.save();
    res.json({ session, player });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST pause/resume (admin only)
router.post('/pause', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await AuctionSession.findById(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    session.status = session.status === 'Active' ? 'Paused' : 'Active';
    await session.save();
    res.json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST undo last bid (admin only)
router.post('/undo-bid', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await AuctionSession.findById(sessionId);
    if (!session || session.status !== 'Active') return res.status(400).json({ error: 'No active session' });
    if (session.bids.length === 0) return res.status(400).json({ error: 'No bids to undo' });
    session.bids.pop();
    if (session.bids.length > 0) {
      const last = session.bids[session.bids.length - 1];
      session.currentBid = last.amount; session.currentBidTeam = last.team; session.currentBidTeamName = last.teamName;
    } else {
      session.currentBid = session.basePrice; session.currentBidTeam = null; session.currentBidTeamName = null;
    }
    await session.save();
    const populated = await session.populate(['player', 'currentBidTeam']);
    res.json(populated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;