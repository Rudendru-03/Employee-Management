require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const logger = require("./logger");

const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();
const fromEmail = process.env.FROM_EMAIL?.trim();

if (!sendgridApiKey) {
  logger.error(
    "❌ Missing SENDGRID_API_KEY. Please set SENDGRID_API_KEY in the environment.",
  );
  process.exit(1);
}

if (!fromEmail) {
  logger.error(
    "❌ Missing FROM_EMAIL. Please set FROM_EMAIL in the environment.",
  );
  process.exit(1);
}

sgMail.setApiKey(sendgridApiKey);

const sendEmail = async (to, subject, text, html) => {
  const message = {
    from: fromEmail,
    to,
    subject,
    text,
    html,
  };

  try {
    const [response] = await sgMail.send(message);
    logger.info(
      "✅ SendGrid Web API message sent:",
      { messageId: response.headers?.["x-message-id"] || response.statusCode }
    );
    return true;
  } catch (err) {
    const errorDetails =
      err.response?.body?.errors?.map((error) => error.message).join(", ") ||
      err.message ||
      String(err);

    logger.error("❌ SendGrid Web API send failed:", { error: errorDetails });
    throw err;
  }
};

module.exports = { sendEmail };
