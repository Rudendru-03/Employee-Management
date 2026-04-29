require("dotenv").config();
const nodemailer = require("nodemailer");

// 1. Create transporter -> configure your SMTP server via SendGrid
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  // secure should be true ONLY if port is 465. For 587, it remains false (using STARTTLS).
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection ONCE when the server starts, not on every email
transporter
  .verify()
  .then(() => console.log("✅ SendGrid Email Server is ready and verified"))
  .catch((err) =>
    console.error(
      "❌ SendGrid Verification failed. Check API Key:",
      err.message,
    ),
  );

const sendEmail = async (to, subject, text, html) => {
  const message = {
    // Matched to your Render setup
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
    html,
  };

  try {
    // 3. send the email
    const info = await transporter.sendMail(message);
    console.log("✅ Message sent successfully:", info.messageId);

    if (info.rejected && info.rejected.length > 0) {
      console.warn("⚠️ Some recipients were rejected:", info.rejected);
    }

    return true;
  } catch (err) {
    // Your excellent error handling remains intact
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
    // Crucial: Throwing the error ensures BullMQ knows the job failed and will retry it
    throw err;
  }
};

module.exports = { sendEmail };
