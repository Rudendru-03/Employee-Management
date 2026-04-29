const IORedis = require("ioredis");
require("dotenv").config();

// 1. Check if we are in production (Render)
let redisConnection;

if (process.env.REDIS_URL) {
  // Production Setup: Pass the entire Render URL directly to IORedis
  // IORedis will automatically extract the host, port, and password.
  redisConnection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
} else {
  // Local Development Setup: Fallback to your local Docker container
  redisConnection = new IORedis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
  });
}

// Optional: Add event listeners so you know exactly when Redis connects or fails
redisConnection.on("connect", () => {
  console.log("✅ Successfully connected to Redis");
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

module.exports = { redisConnection };
