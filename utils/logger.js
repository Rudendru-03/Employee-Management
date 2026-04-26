const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");

const logDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const environment = process.env.NODE_ENV || "development";

const logger = createLogger({
  level: environment === "development" ? "debug" : "info",
  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { service: "employee-portal" },
  transports: [
    new transports.File({ filename: path.join(logDir, "error.log"), level: "error" }),
    new transports.File({ filename: path.join(logDir, "combined.log") }),
  ],
  exceptionHandlers: [
    new transports.File({ filename: path.join(logDir, "exceptions.log") }),
  ],
  rejectionHandlers: [
    new transports.File({ filename: path.join(logDir, "rejections.log") }),
  ],
  exitOnError: false,
});

if (environment !== "production") {
  logger.add(
    new transports.Console({
      level: "debug",
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const content = stack || message;
          const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
          return `${timestamp} [${level}]: ${content}${metaString}`;
        })
      ),
    })
  );
}

module.exports = logger;
