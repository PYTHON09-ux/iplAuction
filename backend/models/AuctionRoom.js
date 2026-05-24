// models/AuctionRoom.js
const mongoose = require('mongoose');

const auctionRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },           // e.g. "IPL 2025 Mega Auction"
  description: { type: String, default: '' },
  slug: { type: String, unique: true, trim: true },             // for viewer URL: /view/:slug
  status: { type: String, enum: ['Setup', 'Active', 'Completed'], default: 'Setup' },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  defaultTeamBudget: { type: Number, default: 8000000 },
  defaultBaseBid: { type: Number, default: 100000 },
  bidIncrements: { type: [Number], default: [10000, 25000, 50000, 100000, 250000, 500000] },
  viewerEnabled: { type: Boolean, default: true },
  viewerPassword: { type: String, default: '' },                // optional viewer password
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  createdBy: { type: String, default: 'admin' }
}, { timestamps: true });

// Auto-generate slug from name
auctionRoomSchema.pre('validate', function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now().toString(36);
  }
  next();
});

module.exports = mongoose.model('AuctionRoom', auctionRoomSchema);