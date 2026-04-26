const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error("Error connecting to MongoDB", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

module.exports = connectDB;
