const mongoose = require('mongoose');
const dns = require('node:dns');

const configureDnsForSrv = () => {
  const dnsServers = process.env.DNS_SERVERS;
  if (!dnsServers) {
    return;
  }

  const list = dnsServers
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (list.length === 0) {
    return;
  }

  try {
    dns.setServers(list);
    console.log(`Using custom DNS servers: ${list.join(', ')}`);
  } catch (error) {
    console.warn('Failed to apply custom DNS servers:', error.message);
  }
};

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return;
    }

    if ((process.env.MONGO_URI || '').startsWith('mongodb+srv://')) {
      configureDnsForSrv();
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
