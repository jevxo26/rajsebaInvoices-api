const mongoose = require('mongoose');

if (process.env.USE_JSON_DB === 'true') {
  module.exports = require('../config/jsonDb').Service;
  return;
}

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a service name'],
    unique: true,
    trim: true
  },
  rate: {
    type: Number,
    required: [true, 'Please add a rate per unit'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Service', serviceSchema);
