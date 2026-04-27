const { Worker } = require("bullmq");
const Notification = require("../models/notification");
const { redisConnection } = require("./redis");
const { sendEmail } = require("../utils/mailer");

const queueName = "notificationQueue";

const worker = new Worker(
  queueName,
  async (job) => {
    const { notificationId, email, subject, body } = job.data;

    await sendEmail(email, subject, body);

    await Notification.findByIdAndUpdate(notificationId, {
      status: "sent",
      sentAt: new Date(),
      error: null,
    });

    return { success: true };
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

worker.on("failed", async (job, err) => {
  if (!job?.data?.notificationId) return;
  await Notification.findByIdAndUpdate(job.data.notificationId, {
    status: "failed",
    error: err?.message || "Notification job failed",
  });
});

worker.on("error", (err) => {
  console.error("Notification processor error:", err);
});

module.exports = worker;
