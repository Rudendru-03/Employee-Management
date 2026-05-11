// services/notificationService.js - IMPROVED VERSION
const User = require("../models/user");
const Employee = require("../models/employee");
const { enqueueNotification } = require("./notificationQueue");
const { generateLeaveEmail, generateAnnouncementEmail } = require("../utils/emailTemplates");
const logger = require("../utils/logger");

const sendLeaveNotification = async (leave) => {
  try {
    const recipient = leave?.userId;
    if (!recipient?.email) {
      logger.warn("⚠️ No recipient email for leave notification", {
        leaveId: leave._id,
      });
      return null;
    }

    // Calculate duration
    const fromDate = new Date(leave.fromDate);
    const toDate = new Date(leave.toDate);
    const duration = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;

    // Generate HTML email with template
    const html = generateLeaveEmail({
      username: recipient.username || "Team Member",
      status: leave.status,
      leaveType: leave.leaveType,
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      duration,
      reason: leave.reason,
      reviewedBy: leave.reviewedBy?.username,
      comments: leave.comments,
      leaveId: leave._id.toString(),
    });

    const subject = `Leave Request ${leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}`;
    
    // Plain text fallback
    const text = `Hello ${recipient.username},\n\nYour leave request from ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()} has been ${leave.status}.\n\nLeave Type: ${leave.leaveType}\nReason: ${leave.reason}\n\nThank you.`;

    return enqueueNotification({
      userId: recipient._id,
      email: recipient.email,
      type: "leave_approval",
      subject,
      body: html, // HTML template
      metadata: {
        leaveId: leave._id.toString(),
        status: leave.status,
        leaveType: leave.leaveType,
      },
      priority: 3, // Higher priority for leave notifications
    });
  } catch (error) {
    logger.error("❌ Failed to send leave notification", {
      leaveId: leave._id,
      error: error.message,
    });
    throw error;
  }
};

const sendAnnouncementNotifications = async (announcement) => {
  try {
    let recipients = [];

    // Fetch recipients based on target
    if (announcement.target === "all") {
      recipients = await User.find({ status: "active" }).select("email _id username");
    } else if (announcement.target === "employee") {
      recipients = await User.find({ role: "employee", status: "active" }).select("email _id username");
    } else if (announcement.target === "department") {
      const employees = await Employee.find({ 
        department: announcement.department 
      }).populate("userId", "email username");
      
      recipients = employees
        .filter((emp) => emp.userId?.email)
        .map((emp) => ({
          _id: emp.userId._id,
          email: emp.userId.email,
          username: emp.userId.username,
        }));
    }

    if (!recipients.length) {
      logger.warn("⚠️ No recipients found for announcement", {
        announcementId: announcement._id,
        target: announcement.target,
      });
      return [];
    }

    logger.info("📢 Sending announcement to recipients", {
      announcementId: announcement._id,
      count: recipients.length,
    });

    // Enqueue notifications
    const notifications = await Promise.all(
      recipients.map((recipient) => {
        const html = generateAnnouncementEmail({
          username: recipient.username || "Team Member",
          title: announcement.title,
          description: announcement.description,
          publishedDate: announcement.createdAt,
          announcementId: announcement._id.toString(),
        });

        const subject = `New Announcement: ${announcement.title}`;
        const text = `${announcement.description}\n\nPlease check the Employee Portal for more details.`;

        return enqueueNotification({
          userId: recipient._id,
          email: recipient.email,
          type: "announcement",
          subject,
          body: html,
          metadata: {
            announcementId: announcement._id.toString(),
            target: announcement.target,
          },
          priority: 5, // Lower priority for announcements
        });
      })
    );

    return notifications;
  } catch (error) {
    logger.error("❌ Failed to send announcement notifications", {
      announcementId: announcement._id,
      error: error.message,
    });
    throw error;
  }
};

module.exports = {
  sendLeaveNotification,
  sendAnnouncementNotifications,
};