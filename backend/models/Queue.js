const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a queue name'],
  },
  serviceTime: {
    type: Number,
    required: [true, 'Please add average service time in minutes'],
    default: 10,
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'closed',
  },
  currentToken: {
    type: Number,
    default: 0,
  },
  lastToken: {
    type: Number,
    default: 0,
  },
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' }
  },
  maxCapacity: {
    type: Number,
    default: 50
  },
  counters: [{
    name: { type: String, required: true },
    currentToken: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Queue', queueSchema);
