const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  eventToken: {
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: String,
    required: true,
    trim: true,
    maxlength: 30,
  },
  // 'guest' | 'system'
  senderType: {
    type: String,
    enum: ['guest', 'system'],
    default: 'guest',
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 400,
  },
  // Soft colour assigned to guest (index into palette, stored so same user
  // gets consistent colour within a session if they rejoin)
  colorIndex: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// TTL index — auto-delete messages older than 24 hours
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);