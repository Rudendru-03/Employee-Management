require("dotenv").config();
const sgMail = require("@sendgrid/mail");
const logger = require("./logger");

const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim();
const fromEmail = process.env.FROM_EMAIL?.trim();
const fromName = process.env.FROM_NAME?.trim() || "Employee Portal";

if (!sendgridApiKey || !fromEmail) {
  logger.error("❌ Missing SendGrid configuration");
  process.exit(1);
}

sgMail.setApiKey(sendgridApiKey);

/**
 * Send email via SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @param {Object} options.metadata - Custom metadata for tracking
 * @param {Array} options.attachments - File attachments
 * @returns {Promise<Object>} SendGrid response
 */
const sendEmail = async (options) => {
  const { to, subject, text, html, metadata = {}, attachments = [] } = options;

  if (!to || !subject) {
    throw new Error("Recipient and subject are required");
  }

  const message = {
    from: {
      email: fromEmail,
      name: fromName,
    },
    to,
    subject,
    text: text || "Please view this email in HTML format.",
    html: html || text,
    customArgs: metadata, // SendGrid custom tracking
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: true },
    },
  };

  if (attachments.length > 0) {
    message.attachments = attachments.map((att) => ({
      content: att.content, // Base64 encoded
      filename: att.filename,
      type: att.type || "application/pdf",
      disposition: "attachment",
    }));
  }

  try {
    const [response] = await sgMail.send(message);
    
    const messageId = response.headers?.["x-message-id"] || response.headers?.["X-Message-Id"];

    logger.info("✅ Email sent successfully", {
      to,
      subject,
      messageId,
      statusCode: response.statusCode,
    });

    return {
      success: true,
      messageId,
      statusCode: response.statusCode,
    };
  } catch (err) {
    // Extract detailed error from SendGrid
    const errorDetails = {
      message: err.message,
      code: err.code,
      statusCode: err.response?.statusCode,
    };

    if (err.response?.body?.errors) {
      errorDetails.errors = err.response.body.errors.map((e) => ({
        message: e.message,
        field: e.field,
        help: e.help,
      }));
    }

    logger.error("❌ SendGrid send failed", {
      to,
      subject,
      error: errorDetails,
    });

    // Throw with categorized error for retry logic
    const error = new Error(
      errorDetails.errors?.[0]?.message || err.message
    );
    error.code = err.code;
    error.statusCode = errorDetails.statusCode;
    error.isRetryable = [429, 500, 502, 503, 504].includes(
      errorDetails.statusCode
    );

    throw error;
  }
};

/**
 * Send bulk emails (up to 1000 recipients)
 * Uses SendGrid's batch sending for efficiency
 */
const sendBulkEmails = async (emails) => {
  if (!Array.isArray(emails) || emails.length === 0) {
    throw new Error("Emails array is required");
  }

  if (emails.length > 1000) {
    throw new Error("Maximum 1000 emails per batch");
  }

  const messages = emails.map(({ to, subject, text, html, metadata }) => ({
    from: { email: fromEmail, name: fromName },
    to,
    subject,
    text: text || "Please view this email in HTML format.",
    html: html || text,
    customArgs: metadata || {},
  }));

  try {
    const results = await sgMail.send(messages);
    logger.info("✅ Bulk emails sent", { count: emails.length });
    return { success: true, count: emails.length };
  } catch (err) {
    logger.error("❌ Bulk send failed", { error: err.message });
    throw err;
  }
};

module.exports = { sendEmail, sendBulkEmails };