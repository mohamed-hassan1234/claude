const mongoose = require('mongoose');

const connectDB = async () => {
  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    'mongodb://127.0.0.1:27017/cloud_survey_system';
  const options = {};

  if (process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) {
    options.user = process.env.MONGODB_USER;
    options.pass = process.env.MONGODB_PASSWORD;
    options.authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
  }

  try {
    await mongoose.connect(uri, options);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
