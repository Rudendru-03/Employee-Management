const { Queue, JobScheduler } = require("bullmq");
const Notification = require("../models/notification");
const { redisConnection } = require("./redis");

const queueName = "notificationQueue";
let notificationQueue;
let queueScheduler;

const getNotificationQueue = () => {
  if (!notificationQueue) {
    notificationQueue = new Queue(queueName, {
      connection: redisConnection,
    });
  }

  if (!queueScheduler) {
    queueScheduler = new JobScheduler(queueName, {
      connection: redisConnection,
    });
  }

  return notificationQueue;
};

const enqueueNotification = async (payload) => {
  const notification = await Notification.create({
    ...payload,
    status: "queued",
  });

  const queue = getNotificationQueue();
  await queue.add(
    "send-notification",
    {
      ...payload,
      notificationId: notification._id,
    },
    {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  return notification;
};

module.exports = {
  queueName,
  enqueueNotification,
};
