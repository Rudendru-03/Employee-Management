require("dotenv").config();
const sgMail = require("@sendgrid/mail");

const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();
const fromEmail = process.env.FROM_EMAIL?.trim();

if (!sendgridApiKey) {
  console.error(
    "❌ Missing SENDGRID_API_KEY. Please set SENDGRID_API_KEY in the environment.",
  );
  process.exit(1);
}

if (!fromEmail) {
  console.error(
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
    console.log(
      "✅ SendGrid Web API message sent:",
      response.headers?.["x-message-id"] || response.statusCode,
    );
    return true;
  } catch (err) {
    const errorDetails =
      err.response?.body?.errors?.map((error) => error.message).join(", ") ||
      err.message ||
      String(err);

    console.error("❌ SendGrid Web API send failed:", errorDetails);
    throw err;
  }
};

module.exports = { sendEmail };
