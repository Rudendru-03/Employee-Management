const { Queue, QueueScheduler } = require("bullmq");
const Notification = require("../models/notification");
const { redisConnection } = require("./redis");
const logger = require("../utils/logger");

const queueName = "notificationQueue";
const dlqName = "notificationDLQ";

let notificationQueue;
let deadLetterQueue;
let queueScheduler;

const getNotificationQueue = () => {
  if (!notificationQueue) {
    notificationQueue = new Queue(queueName, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 5, // Increased from 3
        backoff: {
          type: "exponential",
          delay: 2000, // Start with 2s, grows exponentially
        },
        removeOnComplete: {
          age: 24 * 3600, // Keep successful jobs for 24 hours
          count: 1000, // Keep last 1000 successful jobs
        },
        removeOnFail: false, // Keep failed jobs for DLQ processing
      },
    });
  }

  if (!deadLetterQueue) {
    deadLetterQueue = new Queue(dlqName, {
      connection: redisConnection,
    });
  }

  if (!queueScheduler) {
    queueScheduler = new QueueScheduler(queueName, {
      connection: redisConnection,
    });
  }

  return { notificationQueue, deadLetterQueue };
};

const enqueueNotification = async (payload) => {
  try {
    // Validate payload before creating DB record
    if (!payload.email || !payload.subject) {
      throw new Error("Email and subject are required");
    }

    const notification = await Notification.create({
      ...payload,
      status: "queued",
      retryCount: 0,
    });

    const { notificationQueue } = getNotificationQueue();
    
    const job = await notificationQueue.add(
      "send-notification",
      {
        ...payload,
        notificationId: notification._id.toString(),
      },
      {
        jobId: `notif-${notification._id}`, // Idempotency key
        attempts: 5,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        // Priority system (lower number = higher priority)
        priority: payload.priority || 5,
      }
    );

    logger.info("✅ Notification enqueued", {
      notificationId: notification._id,
      jobId: job.id,
      email: payload.email,
    });

    return notification;
  } catch (error) {
    logger.error("❌ Failed to enqueue notification", {
      error: error.message,
      payload,
    });
    throw error;
  }
};

// Manual retry from DLQ
const retryFromDLQ = async (jobId) => {
  const { deadLetterQueue, notificationQueue } = getNotificationQueue();
  
  const job = await deadLetterQueue.getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found in DLQ`);
  }

  // Re-enqueue with fresh attempts
  await notificationQueue.add("send-notification", job.data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
  });

  await job.remove();
  logger.info("✅ Job retried from DLQ", { jobId });
};

// Get DLQ statistics
const getDLQStats = async () => {
  const { deadLetterQueue } = getNotificationQueue();
  
  const failedCount = await deadLetterQueue.getFailedCount();
  const jobs = await deadLetterQueue.getJobs(["failed"], 0, 100);
  
  return {
    failedCount,
    recentFailures: jobs.map(job => ({
      id: job.id,
      email: job.data.email,
      error: job.failedReason,
      timestamp: job.timestamp,
    })),
  };
};

module.exports = {
  queueName,
  dlqName,
  enqueueNotification,
  getNotificationQueue,
  retryFromDLQ,
  getDLQStats,
};