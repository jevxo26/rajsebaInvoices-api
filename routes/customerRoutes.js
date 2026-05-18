const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// @desc    Get all customers
// @route   GET /api/customers
router.get('/', async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ name: 1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create or Update a customer (Upsert by phone)
// @route   POST /api/customers
router.post('/', async (req, res) => {
  const { name, phone, email, address } = req.body;

  if (!name || !phone || !address) {
    return res.status(400).json({ message: 'Name, phone, and address are required' });
  }

  try {
    // Upsert by phone number
    const customer = await Customer.findOneAndUpdate(
      { phone: phone.trim() },
      { name: name.trim(), email: email ? email.trim() : '', address: address.trim() },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    if (process.env.USE_JSON_DB === 'true') {
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../data/db.json');
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      data.customers = data.customers.filter(c => c._id !== req.params.id);
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      return res.json({ message: 'Customer deleted successfully' });
    }

    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
