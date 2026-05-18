const mongoose = require('mongoose');

if (process.env.USE_JSON_DB === 'true') {
  module.exports = require('../config/jsonDb').Customer;
  return;
}

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a customer name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Customer', customerSchema);
