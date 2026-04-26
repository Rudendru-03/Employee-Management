const logger = require("../utils/logger");

function notFound(req, res, next) {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  logger.warn("Route not found", {
    method: req.method,
    url: req.originalUrl,
  });
  next(error);
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  logger.error("Unhandled request error", {
    message,
    statusCode,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    params: req.params,
    query: req.query,
  });

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV !== "production" ? { stack: error.stack } : {}),
  });
}

module.exports = {
  notFound,
  errorHandler,
};
