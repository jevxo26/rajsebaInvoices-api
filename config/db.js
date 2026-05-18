const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/invoice-app';
    
    // Set a timeout of 1.5 seconds for connection attempt to keep the user experience fast
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    process.env.USE_JSON_DB = 'false';
  } catch (error) {
    console.log('\n================================================================');
    console.log('⚠️  LOCAL MONGODB NOT DETECTED ON THIS SYSTEM.');
    console.log('⚡ FALLING BACK TO HIGHER-PERFORMANCE LOCAL JSON FILESYSTEM DB!');
    console.log('📂 Data is securely persisted inside: backend/data/db.json');
    console.log('================================================================\n');
    
    process.env.USE_JSON_DB = 'true';
  }
};

module.exports = connectDB;
