// utils/emailTemplates.js - NEW FILE
const { readFileSync } = require("fs");
const path = require("path");
const handlebars = require("handlebars"); // npm install handlebars

// Base HTML template with company branding
const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #667eea;
      font-size: 20px;
      margin-top: 0;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin: 10px 0;
    }
    .status-approved { background-color: #d4edda; color: #155724; }
    .status-rejected { background-color: #f8d7da; color: #721c24; }
    .status-pending { background-color: #fff3cd; color: #856404; }
    .details-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .details-box p {
      margin: 8px 0;
    }
    .button {
      display: inline-block;
      padding: 12px 30px;
      background-color: #667eea;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>{{companyName}}</h1>
    </div>
    <div class="content">
      {{{body}}}
    </div>
    <div class="footer">
      <p>&copy; {{year}} {{companyName}}. All rights reserved.</p>
      <p>This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

// Leave notification template
const leaveTemplate = `
  <h2>Leave Request {{status}}</h2>
  
  <p>Hello {{username}},</p>
  
  <p>Your leave request has been <strong>{{status}}</strong>.</p>
  
  <span class="status-badge status-{{status}}">{{statusText}}</span>
  
  <div class="details-box">
    <p><strong>Leave Type:</strong> {{leaveType}}</p>
    <p><strong>From:</strong> {{fromDate}}</p>
    <p><strong>To:</strong> {{toDate}}</p>
    <p><strong>Duration:</strong> {{duration}} day(s)</p>
    <p><strong>Reason:</strong> {{reason}}</p>
    {{#if reviewedBy}}
    <p><strong>Reviewed By:</strong> {{reviewedBy}}</p>
    {{/if}}
    {{#if comments}}
    <p><strong>Comments:</strong> {{comments}}</p>
    {{/if}}
  </div>
  
  <p>
    <a href="{{portalUrl}}/leaves/{{leaveId}}" class="button">View Details</a>
  </p>
  
  <p>If you have any questions, please contact HR.</p>
  
  <p>Best regards,<br>HR Team</p>
`;

// Announcement template
const announcementTemplate = `
  <h2>{{title}}</h2>
  
  <p>Hello {{username}},</p>
  
  <div class="details-box">
    {{{description}}}
  </div>
  
  <p><small>Published on {{publishedDate}}</small></p>
  
  <p>
    <a href="{{portalUrl}}/announcements/{{announcementId}}" class="button">Read More</a>
  </p>
  
  <p>Best regards,<br>{{companyName}} Team</p>
`;

// Compile templates
const compileTemplate = (templateString) => handlebars.compile(templateString);

const baseCompiled = compileTemplate(baseTemplate);
const leaveCompiled = compileTemplate(leaveTemplate);
const announcementCompiled = compileTemplate(announcementTemplate);

// Template generator functions
const generateLeaveEmail = (data) => {
  const statusText = {
    approved: "APPROVED",
    rejected: "REJECTED",
    pending: "PENDING",
  }[data.status] || data.status.toUpperCase();

  const body = leaveCompiled({
    ...data,
    statusText,
    fromDate: new Date(data.fromDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    toDate: new Date(data.toDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    portalUrl: process.env.PORTAL_URL || "https://portal.yourcompany.com",
  });

  return baseCompiled({
    companyName: process.env.COMPANY_NAME || "Employee Portal",
    year: new Date().getFullYear(),
    body,
  });
};

const generateAnnouncementEmail = (data) => {
  const body = announcementCompiled({
    ...data,
    publishedDate: new Date(data.publishedDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    portalUrl: process.env.PORTAL_URL || "https://portal.yourcompany.com",
    companyName: process.env.COMPANY_NAME || "Employee Portal",
  });

  return baseCompiled({
    companyName: process.env.COMPANY_NAME || "Employee Portal",
    year: new Date().getFullYear(),
    body,
  });
};

module.exports = {
  generateLeaveEmail,
  generateAnnouncementEmail,
};