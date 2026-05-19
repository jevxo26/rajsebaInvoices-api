const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.USE_JSON_DB === 'true') {
    console.log('Using JSON DB (Skipping MongoDB Connection)');
    return;
  }

  try {
    const uri = 'mongodb+srv://invoice:rtGDlW4UgJRrvQY8@invoice.borcxr6.mongodb.net/?appName=invoice';

    // Set a timeout of 5 seconds for connection attempt to allow for Vercel cold starts
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
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
