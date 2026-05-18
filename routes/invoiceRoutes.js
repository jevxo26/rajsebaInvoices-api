const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const Service = require('../models/Service');

// @desc    Get all invoices
// @route   GET /api/invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: { $ne: 'trashed' } }).sort({ date: -1, createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all trashed invoices
// @route   GET /api/invoices/trash
router.get('/trash', async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: 'trashed' }).sort({ deletedAt: -1, date: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single invoice by ID
// @route   GET /api/invoices/:id
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.id || req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create a new invoice
// @route   POST /api/invoices
router.post('/', async (req, res) => {
  const {
    invoiceNumber,
    date,
    customer,
    items,
    totalAmount,
    totalPayableAmount,
    amountInWords,
    templateName,
    paymentOptions,
    signeeName,
    signeeRole,
    paidAmount,
    dueAmount,
    paymentStatus
  } = req.body;

  if (!invoiceNumber || !customer || !items || items.length === 0 || !amountInWords) {
    return res.status(400).json({ message: 'Invoice number, customer, items, and amount in words are required' });
  }

  try {
    // 1. Dynamic Customer Creation/Upsert (Ensure customer is saved to DB for future selection)
    if (customer.name && customer.phone && customer.address) {
      await Customer.findOneAndUpdate(
        { phone: customer.phone.trim() },
        { 
          name: customer.name.trim(), 
          email: customer.email ? customer.email.trim() : '', 
          address: customer.address.trim() 
        },
        { new: true, upsert: true }
      );
    }

    // 2. Dynamic Service Creation (Save new services to DB so they appear in dropdown suggestions next time)
    for (const item of items) {
      if (item.description && item.rate > 0) {
        await Service.findOneAndUpdate(
          { name: item.description.trim() },
          { rate: Number(item.rate) },
          { new: true, upsert: true }
        );
      }
    }

    // 3. Create and Save the Invoice
    const invoice = new Invoice({
      invoiceNumber: invoiceNumber.trim(),
      date: date ? new Date(date) : new Date(),
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email ? customer.email.trim() : '',
        address: customer.address.trim()
      },
      items: items.map(item => ({
        description: item.description.trim(),
        qty: Number(item.qty),
        rate: Number(item.rate),
        amount: Number(item.amount || (item.qty * item.rate))
      })),
      totalAmount: Number(totalAmount || items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0)),
      totalPayableAmount: Number(totalPayableAmount || items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0)),
      amountInWords: amountInWords.trim(),
      templateName: templateName || 'template1',
      paymentOptions: paymentOptions || {
        accountName: 'RAJSEBA.COM',
        accountNumber: '02433002451',
        bankName: 'Bank Asia PLC',
        branch: 'Rajshahi Branch',
        routingNumber: '070811937'
      },
      signeeName: signeeName ? signeeName.trim() : 'Ariful Islam Arif',
      signeeRole: signeeRole ? signeeRole.trim() : 'CEO, Rajseba Design Studio',
      paidAmount: Number(paidAmount) || 0,
      dueAmount: Number(dueAmount) || 0,
      paymentStatus: paymentStatus || 'Due'
    });

    const savedInvoice = await invoice.save();
    res.status(201).json(savedInvoice);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: `Invoice number "${invoiceNumber}" already exists.` });
    }
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete invoice by ID
// @route   DELETE /api/invoices/:id
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, 
      { 
        status: 'trashed',
        deletedAt: new Date()
      },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice moved to trash successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Restore a trashed invoice
// @route   PUT /api/invoices/:id/restore
router.put('/:id/restore', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, 
      { 
        $set: { status: 'active' },
        $unset: { deletedAt: 1 }
      },
      { new: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice restored successfully', invoice });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Permanently delete an invoice
// @route   DELETE /api/invoices/:id/force
router.delete('/:id/force', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update invoice payment / receive due
// @route   PUT /api/invoices/:id/payment
router.put('/:id/payment', async (req, res) => {
  const { amountPaid } = req.body;
  const paymentValue = Number(amountPaid);

  if (isNaN(paymentValue) || paymentValue <= 0) {
    return res.status(400).json({ message: 'Invalid payment amount. Must be a positive number.' });
  }

  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const currentPaid = invoice.paidAmount || 0;
    const total = invoice.totalPayableAmount || invoice.totalAmount;
    
    // Capping at total payable
    const newPaid = Math.min(total, currentPaid + paymentValue);
    const newDue = Math.max(0, total - newPaid);
    const newStatus = newDue === 0 ? 'Paid' : 'Due';

    invoice.paidAmount = newPaid;
    invoice.dueAmount = newDue;
    invoice.paymentStatus = newStatus;

    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
