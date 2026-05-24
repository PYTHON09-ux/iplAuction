const mongoose = require('mongoose');

const auctionEventSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  season: { type: String, default: '' },
  status: { type: String, enum: ['Draft', 'Active', 'Completed'], default: 'Draft' },
  defaultTeamBudget: { type: Number, default: 8000000 },
  defaultBasePrice: { type: Number, default: 100000 },
  minBidIncrement: { type: Number, default: 10000 },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  viewerToken: { type: String, unique: true },
  logo: { type: String, default: '' },
}, { timestamps: true });

// Generate a short viewer token on create
auctionEventSchema.pre('save', function (next) {
  if (!this.viewerToken) {
    this.viewerToken = Math.random().toString(36).slice(2, 10).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('AuctionEvent', auctionEventSchema);
