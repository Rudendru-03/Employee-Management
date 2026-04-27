const User = require("../models/user");
const Employee = require("../models/employee");
const { enqueueNotification } = require("./notificationQueue");

const sendLeaveNotification = async (leave) => {
  const recipient = leave?.userId;
  if (!recipient?.email) {
    return null;
  }

  const fromDate = new Date(leave.fromDate).toLocaleDateString();
  const toDate = new Date(leave.toDate).toLocaleDateString();
  const subject = `Leave request ${leave.status === "approved" ? "approved" : leave.status === "rejected" ? "rejected" : "updated"}`;
  const body = `Hello ${recipient.username || "team"},\n\nYour leave request from ${fromDate} to ${toDate} has been ${leave.status}.\n\nLeave type: ${leave.leaveType}\nReason: ${leave.reason}\n\nThank you.`;

  return enqueueNotification({
    userId: recipient._id,
    email: recipient.email,
    type: "leave_approval",
    subject,
    body,
    metadata: {
      leaveId: leave._id.toString(),
      status: leave.status,
    },
  });
};

const sendAnnouncementNotifications = async (announcement) => {
  let recipients = [];
  const subject = `New announcement: ${announcement.title}`;
  const body = `${announcement.description}\n\nPlease check the announcements section in the Employee Portal for more details.`;

  if (announcement.target === "all") {
    recipients = await User.find({ status: "active" }).select("email _id");
  } else if (announcement.target === "employee") {
    recipients = await User.find({ role: "employee", status: "active" }).select("email _id");
  } else if (announcement.target === "department") {
    const employees = await Employee.find({ department: announcement.department }).populate("userId", "email");
    recipients = employees
      .filter((employee) => employee.userId?.email)
      .map((employee) => ({ _id: employee.userId._id, email: employee.userId.email }));
  }

  if (!recipients.length) {
    return [];
  }

  return Promise.all(
    recipients.map((recipient) =>
      enqueueNotification({
        userId: recipient._id,
        email: recipient.email,
        type: "announcement",
        subject,
        body,
        metadata: {
          announcementId: announcement._id.toString(),
          target: announcement.target,
          department: announcement.department ? announcement.department.toString() : null,
        },
      }),
    ),
  );
};

module.exports = {
  sendLeaveNotification,
  sendAnnouncementNotifications,
};
