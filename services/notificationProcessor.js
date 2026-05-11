const { Worker } = require("bullmq");
const Notification = require("../models/notification");
const { redisConnection } = require("./redis");
const { sendEmail } = require("../utils/mailer");
const logger = require("../utils/logger");
const { getNotificationQueue, dlqName } = require("./notificationQueue");

const queueName = "notificationQueue";

// Categorize errors for smart retry logic
const isRetryableError = (error) => {
  const retryablePatterns = [
    /ECONNREFUSED/,
    /ETIMEDOUT/,
    /ENOTFOUND/,
    /rate limit/i,
    /too many requests/i,
    /503/,
    /502/,
  ];
  
  return retryablePatterns.some(pattern => 
    pattern.test(error.message)
  );
};

const worker = new Worker(
  queueName,
  async (job) => {
    const { notificationId, email, subject, body, metadata } = job.data;

    logger.info("📧 Processing notification", {
      jobId: job.id,
      notificationId,
      email,
      attempt: job.attemptsMade + 1,
    });

    try {
      // Update retry count in DB
      await Notification.findByIdAndUpdate(notificationId, {
        retryCount: job.attemptsMade,
        lastAttemptAt: new Date(),
      });

      // Send email
      const result = await sendEmail({
        to: email,
        subject,
        text: body,
        html: body, // You'll improve this with templates
        metadata,
      });

      // Update notification status
      await Notification.findByIdAndUpdate(notificationId, {
        status: "sent",
        sentAt: new Date(),
        error: null,
        externalId: result.messageId, // Store SendGrid message ID
      });

      logger.info("✅ Notification sent successfully", {
        jobId: job.id,
        notificationId,
        email,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      logger.error("❌ Notification send failed", {
        jobId: job.id,
        notificationId,
        email,
        error: error.message,
        attempt: job.attemptsMade + 1,
        isRetryable: isRetryableError(error),
      });

      // Update DB with error
      await Notification.findByIdAndUpdate(notificationId, {
        status: job.attemptsMade + 1 >= 5 ? "failed" : "retrying",
        error: error.message,
        lastAttemptAt: new Date(),
      });

      // If non-retryable error, throw special error to move to DLQ immediately
      if (!isRetryableError(error)) {
        const nonRetryableError = new Error(error.message);
        nonRetryableError.name = "NonRetryableError";
        throw nonRetryableError;
      }

      throw error; // Let BullMQ handle retry
    }
  },
  {
    connection: redisConnection,
    concurrency: 10, // Increased for better throughput
    limiter: {
      max: 100, // Max 100 jobs
      duration: 1000, // Per second (respect SendGrid rate limits)
    },
  }
);

// Move permanently failed jobs to DLQ
worker.on("failed", async (job, err) => {
  if (!job?.data?.notificationId) return;

  const isLastAttempt = job.attemptsMade >= (job.opts.attempts || 5);
  
  logger.error("❌ Job failed", {
    jobId: job.id,
    notificationId: job.data.notificationId,
    attempt: job.attemptsMade,
    isLastAttempt,
    error: err.message,
  });

  if (isLastAttempt) {
    // Move to Dead Letter Queue
    const { deadLetterQueue } = getNotificationQueue();
    
    await deadLetterQueue.add(
      "failed-notification",
      {
        ...job.data,
        originalJobId: job.id,
        failedReason: err.message,
        failedAt: new Date(),
        attempts: job.attemptsMade,
      },
      {
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    // Update DB
    await Notification.findByIdAndUpdate(job.data.notificationId, {
      status: "failed",
      error: err.message,
      movedToDLQ: true,
      failedAt: new Date(),
    });

    logger.warn("🚨 Job moved to DLQ", {
      jobId: job.id,
      notificationId: job.data.notificationId,
    });
  }
});

worker.on("completed", (job) => {
  logger.info("✅ Job completed", {
    jobId: job.id,
    notificationId: job.data.notificationId,
    duration: job.finishedOn - job.processedOn,
  });
});

worker.on("error", (err) => {
  logger.error("💥 Worker error:", { message: err.message, stack: err.stack });
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("🛑 SIGTERM received, closing worker gracefully...");
  await worker.close();
  process.exit(0);
});

module.exports = worker;