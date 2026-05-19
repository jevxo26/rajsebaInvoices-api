const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Fix for Vercel/Production: If no MONGO_URI is provided, fallback to JSON DB immediately
// so that models are loaded correctly without timing out on Mongoose.
if ((process.env.VERCEL || process.env.NODE_ENV === 'production') && !process.env.MONGO_URI) {
  process.env.USE_JSON_DB = 'true';
}

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Basic Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Rajseba Invoices API' });
});

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Invoice API is running smoothly' });
});

// Routes
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'An internal server error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Port
const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
}

module.exports = app;
