const mongoose = require('mongoose');

if (process.env.USE_JSON_DB === 'true') {
  module.exports = require('../config/jsonDb').Invoice;
  return;
}

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  qty: {
    type: Number,
    required: true,
    default: 1
  },
  rate: {
    type: Number,
    required: true,
    default: 0
  },
  amount: {
    type: Number,
    required: true,
    default: 0
  }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Please add an invoice number'],
    unique: true,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add a date'],
    default: Date.now
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true }
  },
  items: [invoiceItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  totalPayableAmount: {
    type: Number,
    required: true,
    default: 0
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Due'],
    default: 'Due'
  },
  amountInWords: {
    type: String,
    required: true,
    trim: true
  },
  templateName: {
    type: String,
    required: true,
    enum: ['template1', 'template2'],
    default: 'template1'
  },
  paymentOptions: {
    accountName: { type: String, default: 'RAJSEBA.COM' },
    accountNumber: { type: String, default: '02433002451' },
    bankName: { type: String, default: 'Bank Asia PLC' },
    branch: { type: String, default: 'Rajshahi Branch' },
    routingNumber: { type: String, default: '070811937' }
  },
  signeeName: {
    type: String,
    default: 'Ariful Islam Arif'
  },
  signeeRole: {
    type: String,
    default: 'CEO, Rajseba Design Studio'
  },
  status: {
    type: String,
    enum: ['active', 'trashed'],
    default: 'active'
  },
  deletedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index to automatically delete documents 14 days (1209600 seconds) after deletedAt is set
invoiceSchema.index({ deletedAt: 1 }, { expireAfterSeconds: 1209600 });

module.exports = mongoose.model('Invoice', invoiceSchema);
