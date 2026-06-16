const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  shortName: { type: String, required: true, maxlength: 4, uppercase: true },
  owner: { type: String, required: true },
  city: { type: String, default: '' },
  color: { type: String, default: '#3B82F6' },
  budget: { type: Number, required: true, default: 3000 },
  remainingBudget: { type: Number },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  maxPlayers: { type: Number, default: 15 },
  minPlayers: { type: Number, default: 11 },
  logo: { type: String, default: '' },
  logoPublicId: { type: String, default: '' },
  auctionEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'AuctionEvent', default: null },
}, { timestamps: true });

teamSchema.pre('save', function(next) {
  if (this.isNew) this.remainingBudget = this.budget;
  next();
});

module.exports = mongoose.model('Team', teamSchema);
