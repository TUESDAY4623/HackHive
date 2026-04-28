const mongoose = require('mongoose');
const dns = require('dns');

// Force Google DNS (8.8.8.8) to resolve MongoDB SRV records
// This fixes "querySrv ECONNREFUSED" errors caused by ISPs blocking SRV lookups
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const connectDB = async () => {
  // Try SRV string first, fall back to direct if it fails
  const SRV_URI = `mongodb+srv://utkarshsingh4623_db_user:6lUMIAbVj0ZppFLi@cluster0.d6ik626.mongodb.net/hackhive?retryWrites=true&w=majority&appName=Cluster0`;
  const DIRECT_URI = `mongodb://utkarshsingh4623_db_user:6lUMIAbVj0ZppFLi@ac-exeeoxo-shard-00-00.d6ik626.mongodb.net:27017,ac-exeeoxo-shard-00-01.d6ik626.mongodb.net:27017,ac-exeeoxo-shard-00-02.d6ik626.mongodb.net:27017/hackhive?ssl=true&replicaSet=atlas-11jnb5-shard-0&authSource=admin&retryWrites=true&w=majority`;

  // Use the URI from .env, then fall back to hardcoded SRV, then direct
  const uriToTry = process.env.MONGO_URI || SRV_URI;

  for (const [label, uri] of [['ENV', uriToTry], ['SRV', SRV_URI], ['DIRECT', DIRECT_URI]]) {
    // Skip duplicate attempts
    if (label !== 'ENV' && uri === uriToTry) continue;
    try {
      console.log(`🔌 Trying MongoDB connection [${label}]...`);
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`⚠️  [${label}] failed: ${error.message}`);
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    }
  }

  console.error('❌ All MongoDB connection attempts failed.');
  console.error('💡 Tips:');
  console.error('   1. MongoDB Atlas → Network Access → Add 0.0.0.0/0');
  console.error('   2. Check your internet connection');
  console.error('   3. Try a mobile hotspot if your ISP blocks DNS SRV');
  process.exit(1);
};

module.exports = connectDB;
