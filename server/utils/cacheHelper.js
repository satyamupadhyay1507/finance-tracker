const redisClient = require('../config/redis');

// helper function to get data from cache
const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (data) {
      // console.log("cache hit for", key);
      return JSON.parse(data);
    }
    return null;
  } catch (err) {
    console.log("redis get error", err);
    return null;
  }
};

// helper to set cache with expiry
const setCache = async (key, data, expireSeconds = 900) => {
  try {
    // 900 is 15 mins by default
    await redisClient.setEx(key, expireSeconds, JSON.stringify(data));
  } catch (err) {
    console.log("redis set error", err);
  }
};

// invalidate cache when we add/edit/delete
const invalidateUserCache = async (userId) => {
  try {
    // finding all keys for this user and deleting them
    const keys = await redisClient.keys(`*user:${userId}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      // console.log("deleted cache keys", keys);
    }
  } catch (err) {
    console.log("redis del error", err);
  }
};

module.exports = { getCache, setCache, invalidateUserCache };
