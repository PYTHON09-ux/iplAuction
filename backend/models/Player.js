const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'], required: true },
  basePrice: { type: Number, required: true, default: 50000 },
  soldPrice: { type: Number, default: null },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  auctionEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionEvent', default: null },
  status: { type: String, enum: ['Available', 'Sold', 'Unsold'], default: 'Available' },
  battingStyle: { type: String, enum: ['Right-Hand', 'Left-Hand'], default: 'Right-Hand' },
  bowlingStyle: { type: String, default: '' },
  nationality: { type: String, default: 'Indian' },
  age: { type: Number, default: 22 },
  jerseyNumber: { type: Number, default: null },
  stats: {
    matches: { type: Number, default: 0 },
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    average: { type: Number, default: 0 }
  },
  imageUrl: { type: String, default: '' },
  imagePublicId: { type: String, default: '' },
  auctionOrder: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
