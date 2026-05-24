const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Team = require('../models/Team');
const AuctionSession = require('../models/AuctionSession');
const AuctionEvent = require('../models/AuctionEvent');
const auth = require('../middleware/auth');

router.post('/demo', auth, async (req, res) => {
  try {
    await Player.deleteMany({}); await Team.deleteMany({}); await AuctionSession.deleteMany({}); await AuctionEvent.deleteMany({});
    const event = new AuctionEvent({ name: 'Demo IPL Auction 2025', season: '2025', status: 'Active', defaultTeamBudget: 8000000, defaultBasePrice: 100000, minBidIncrement: 10000, createdBy: req.admin.id });
    await event.save();
    const teams = await Team.insertMany([
      { name: 'Mumbai Warriors', shortName: 'MUW', owner: 'Raj Malhotra', city: 'Mumbai', color: '#1E40AF', budget: 8000000, remainingBudget: 8000000, auctionEvent: event._id },
      { name: 'Delhi Dynamos', shortName: 'DEL', owner: 'Priya Sharma', city: 'Delhi', color: '#DC2626', budget: 8000000, remainingBudget: 8000000, auctionEvent: event._id },
      { name: 'Chennai Kings', shortName: 'CHK', owner: 'Arun Kumar', city: 'Chennai', color: '#D97706', budget: 8000000, remainingBudget: 8000000, auctionEvent: event._id },
      { name: 'Kolkata Tigers', shortName: 'KOT', owner: 'Sunita Roy', city: 'Kolkata', color: '#7C3AED', budget: 8000000, remainingBudget: 8000000, auctionEvent: event._id },
      { name: 'Bangalore Bulls', shortName: 'BLB', owner: 'Vikram Nair', city: 'Bangalore', color: '#065F46', budget: 8000000, remainingBudget: 8000000, auctionEvent: event._id },
    ]);
    event.teams = teams.map(t => t._id);
    const players = await Player.insertMany([
      { name: 'Arjun Sharma', role: 'Batsman', basePrice: 500000, battingStyle: 'Right-Hand', nationality: 'Indian', age: 28, auctionEvent: event._id, auctionOrder: 1, stats: { matches: 45, runs: 1820, wickets: 0, average: 42.3 } },
      { name: 'Rohit Patel', role: 'Batsman', basePrice: 300000, battingStyle: 'Left-Hand', nationality: 'Indian', age: 24, auctionEvent: event._id, auctionOrder: 2, stats: { matches: 22, runs: 780, wickets: 0, average: 38.1 } },
      { name: 'Vikas Iyer', role: 'Bowler', basePrice: 400000, bowlingStyle: 'Right-arm Fast', nationality: 'Indian', age: 26, auctionEvent: event._id, auctionOrder: 3, stats: { matches: 38, runs: 120, wickets: 64, average: 22.4 } },
      { name: 'Karan Mehta', role: 'All-Rounder', basePrice: 600000, battingStyle: 'Right-Hand', bowlingStyle: 'Medium', nationality: 'Indian', age: 30, auctionEvent: event._id, auctionOrder: 4, stats: { matches: 52, runs: 1200, wickets: 45, average: 31.2 } },
      { name: 'Suresh Nair', role: 'Wicket-Keeper', basePrice: 350000, battingStyle: 'Right-Hand', nationality: 'Indian', age: 25, auctionEvent: event._id, auctionOrder: 5, stats: { matches: 30, runs: 650, wickets: 0, average: 28.7 } },
      { name: 'Deepak Singh', role: 'Bowler', basePrice: 250000, bowlingStyle: 'Left-arm Spin', nationality: 'Indian', age: 22, auctionEvent: event._id, auctionOrder: 6, stats: { matches: 18, runs: 45, wickets: 32, average: 19.8 } },
      { name: 'Aakash Verma', role: 'Batsman', basePrice: 450000, battingStyle: 'Right-Hand', nationality: 'Indian', age: 27, auctionEvent: event._id, auctionOrder: 7, stats: { matches: 40, runs: 1560, wickets: 0, average: 40.0 } },
      { name: 'Rahul Gupta', role: 'All-Rounder', basePrice: 500000, battingStyle: 'Left-Hand', bowlingStyle: 'Off-spin', nationality: 'Indian', age: 29, auctionEvent: event._id, auctionOrder: 8, stats: { matches: 48, runs: 980, wickets: 38, average: 26.5 } },
      { name: 'Manish Tiwari', role: 'Bowler', basePrice: 350000, bowlingStyle: 'Right-arm Fast', nationality: 'Indian', age: 23, auctionEvent: event._id, auctionOrder: 9, stats: { matches: 25, runs: 88, wickets: 48, average: 21.1 } },
      { name: 'Hemant Kulkarni', role: 'All-Rounder', basePrice: 550000, battingStyle: 'Left-Hand', bowlingStyle: 'Slow Left-arm', nationality: 'Indian', age: 31, auctionEvent: event._id, auctionOrder: 10, stats: { matches: 60, runs: 1450, wickets: 55, average: 29.8 } },
    ]);
    event.players = players.map(p => p._id);
    await event.save();
    res.json({ message: `✅ Demo data seeded! Viewer token: ${event.viewerToken}`, viewerToken: event.viewerToken, eventId: event._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reset', auth, async (req, res) => {
  try {
    const { auctionEvent } = req.body;
    const filter = auctionEvent ? { auctionEvent } : {};
    await Player.updateMany(filter, { status: 'Available', soldPrice: null, team: null });
    await Team.updateMany(filter, [{ $set: { remainingBudget: '$budget', players: [] } }]);
    await AuctionSession.deleteMany(filter);
    res.json({ message: '✅ Auction reset successfully.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
