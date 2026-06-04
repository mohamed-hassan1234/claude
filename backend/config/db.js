const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  const options = {};

  if (!uri) {
    console.error('MongoDB connection failed: MONGO_URI or MONGODB_URI is required.');
    process.exit(1);
  }

  const uriHasCredentials = /^mongodb(?:\+srv)?:\/\/[^/@]+:[^/@]*@/i.test(uri);

  if (!uriHasCredentials && process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) {
    options.user = process.env.MONGODB_USER;
    options.pass = process.env.MONGODB_PASSWORD;
    options.authSource = process.env.MONGODB_AUTH_SOURCE || 'admin';
  }

  try {
    await mongoose.connect(uri, options);
    if (process.env.NODE_ENV !== 'production') {
      console.info('MongoDB connected');
    }
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
