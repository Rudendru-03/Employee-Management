require("dotenv").config();
const nodemailer = require("nodemailer");

// sending mail with nodemailer take three steps:
// 1. create transporter -> configure your smpt server or another supported transport method.
// 2. Compose your message -> define the sender, recipent, subject and content.
// 3. send the email -> call transporter.sendMail() with your messages options.

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "wilburn10@ethereal.email",
    pass: process.env.SMTP_PASS || "5wbfRJCck2uxSB6yFd",
  },
});

const sendEmail = async (to, subject, text, html) => {
  const message = {
    from:
      process.env.SMTP_FROM ||
      '"Employee Portal Admin" <admin@employeeportal.com>',
    to,
    subject,
    text,
    html,
  };

  try {
    await transporter.verify();
    console.log("Server is ready to take our messages");
  } catch (err) {
    console.error("Verification failed:", err);
    throw err;
  }

  try {
    const info = await transporter.sendMail(message);
    console.log("Message sent:", info.messageId);

    if (info.rejected && info.rejected.length > 0) {
      console.warn("Some recipients were rejected:", info.rejected);
    }

    if (nodemailer.getTestMessageUrl(info)) {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (err) {
    switch (err.code) {
      case "ECONNECTION":
      case "ETIMEDOUT":
        console.error("Network error - retry later:", err.message);
        break;
      case "EAUTH":
        console.error("Authentication failed:", err.message);
        break;
      case "EENVELOPE":
        console.error("Invalid recipients:", err.rejected);
        break;
      default:
        console.error("Send failed:", err.message);
    }
    throw err;
  }
};

module.exports = { sendEmail };
