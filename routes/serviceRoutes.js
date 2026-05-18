const express = require('express');
const router = express.Router();
const Service = require('../models/Service');

// @desc    Get all services
// @route   GET /api/services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find({}).sort({ name: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create or Update a service (Upsert by name)
// @route   POST /api/services
router.post('/', async (req, res) => {
  const { name, rate } = req.body;

  if (!name || rate === undefined) {
    return res.status(400).json({ message: 'Service name and rate are required' });
  }

  try {
    // Upsert by service name
    const service = await Service.findOneAndUpdate(
      { name: name.trim() },
      { rate: Number(rate) },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// @desc    Delete a service
// @route   DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    if (process.env.USE_JSON_DB === 'true') {
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../data/db.json');
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      data.services = data.services.filter(s => s._id !== req.params.id);
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      return res.json({ message: 'Service deleted successfully' });
    }

    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
