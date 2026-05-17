const redis = require('redis');
require('dotenv').config();

// creating redis client
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => {
  // console.log('Redis Client Error, running in no-cache mode', err.message);
});
client.on('connect', () => console.log('Connected to Redis !!'));

// checking if connection works
const connectRedis = async () => {
  try {
    await client.connect();
  } catch (error) {
    console.log("failed to connect redis, continuing without cache")
  }
};

connectRedis();

// wrapping methods so app doesn't crash if disconnected
const safeClient = {
  get: async (key) => client.isReady ? await client.get(key) : null,
  setEx: async (key, time, val) => client.isReady ? await client.setEx(key, time, val) : null,
  keys: async (pattern) => client.isReady ? await client.keys(pattern) : [],
  del: async (key) => client.isReady ? await client.del(key) : null,
};

module.exports = safeClient;
