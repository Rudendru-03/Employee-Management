const IORedis = require("ioredis");
require("dotenv").config();

const parseRedisConnectionOptions = () => {
  const db = process.env.REDIS_DB ? Number(process.env.REDIS_DB) : undefined;

  if (process.env.REDIS_URL) {
    const rawUrl = process.env.REDIS_URL.trim();

    try {
      const redisUrl = rawUrl.includes("://")
        ? new URL(rawUrl)
        : new URL(`redis://${rawUrl}`);

      if (!redisUrl.hostname) {
        throw new Error("REDIS_URL must include a valid hostname");
      }

      const options = {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || 6379),
        username: redisUrl.username || undefined,
        password: redisUrl.password || undefined,
        db,
        maxRetriesPerRequest: null,
      };

      if (redisUrl.protocol === "rediss:") {
        options.tls = {};
      }

      return options;
    } catch (err) {
      console.error("❌ Invalid REDIS_URL:", process.env.REDIS_URL);
      console.error("❌ Redis configuration parse error:", err.message);
      process.exit(1);
    }
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db,
    maxRetriesPerRequest: null,
  };
};

const redisConnection = new IORedis(parseRedisConnectionOptions());

redisConnection.on("connect", () => {
  console.log("✅ Successfully connected to Redis");
});

redisConnection.on("error", (err) => {
  console.error("❌ Redis connection error:", err.message);
});

module.exports = { redisConnection };
