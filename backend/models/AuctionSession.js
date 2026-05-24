const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  teamName: String,
  amount: Number,
  timestamp: { type: Date, default: Date.now }
});

const auctionSessionSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
  auctionEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionEvent', default: null },
  status: { type: String, enum: ['Active', 'Sold', 'Unsold', 'Paused'], default: 'Active' },
  currentBid: { type: Number, default: 0 },
  currentBidTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  currentBidTeamName: { type: String, default: null },
  bids: [bidSchema],
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, default: null },
  basePrice: Number
}, { timestamps: true });

module.exports = mongoose.model('AuctionSession', auctionSessionSchema);
