# Employee Portal

A Node.js-based employee management portal with authentication, employee onboarding, attendance, leave management, payroll, announcements, and background notification delivery.

## Key Features

- User authentication and role-based access control
  - Register and login
  - JWT access tokens and refresh tokens
  - Password change support
- Employee profile management
  - Employee profile retrieval and update
  - Profile photo URL update
- Department management
  - Create, list, update, delete departments
  - Assign department managers
  - Prevent delete when employees are assigned
- Attendance tracking
  - Create attendance records
  - View attendance for admin and employee
  - Update and delete attendance records
- Leave management
  - Apply for leave
  - Update leave status by admin
  - Paginated leave listing and filtering
- Payroll management
  - Create payroll records with net salary calculation
  - Update payroll with salary/deduction/bonus adjustments
  - View payroll records for admin and employees
- Announcements and notification delivery
  - Create announcements for all, a department, or employees
  - Queue email notifications using Redis and BullMQ
  - Send notification on leave approval and announcements
- Background queue and retry support
  - Redis-backed notification queue
  - Job scheduler and worker processing
  - Retry on failure with exponential backoff
- Secure request handling
  - Input validation with Zod
  - Rate limiting for auth endpoints
  - Global error handling

## Architecture Overview

1. `server.js` starts the Express app and connects to MongoDB.
2. The notification worker in `services/notificationProcessor.js` is started at server launch.
3. Redis connection details are defined in `services/redis.js`.
4. `services/notificationQueue.js` creates a BullMQ queue and scheduler.
5. `services/notificationService.js` builds notification payloads for leave and announcement events.
6. Routes enqueue notifications instead of sending email synchronously.
7. The worker consumes jobs, sends email via `utils/mailer.js`, and updates notification status in MongoDB.

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose
- Redis with BullMQ
- Nodemailer for email
- Zod input validation
- Winston logging
- dotenv for environment variables
- nodemon for development

## Prerequisites

- Node.js 18+ installed
- MongoDB instance available
- Redis instance available
- SMTP credentials for email delivery

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd employee-managememt
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file at the project root with the following values:

   ```env
   PORT=5000
   MONGO_DB_URI=mongodb://localhost:27017/employee-portal
   REDIS_HOST=127.0.0.1
   REDIS_PORT=6379
   REDIS_DB=0
   REDIS_PASSWORD=

   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-smtp-username
   SMTP_PASS=your-smtp-password
   SMTP_FROM="Employee Portal Admin" <admin@employeeportal.com>

   ACCESS_TOKEN_SECRET=your-access-token-secret
   REFRESH_TOKEN_SECRET=your-refresh-token-secret
   ADMIN_REGISTER_SECRET=your-admin-registration-secret
   ```

4. Start the server:

   ```bash
   npm run start
   ```

5. Verify the app is running at:

   ```
   http://localhost:5000
   ```

## Important Endpoints

- `POST /api/auth/register` - register a new user
- `POST /api/auth/login` - login and receive access token
- `POST /api/auth/refresh` - refresh access token
- `POST /api/auth/logout` - logout
- `GET /api/profile/me` - get logged-in employee profile
- `PATCH /api/profile/me` - update employee profile
- `POST /api/departments` - create department (admin only)
- `POST /api/attendance` - create attendance record (admin only)
- `POST /api/leaves` - apply for leave
- `PATCH /api/leaves/:id/status` - update leave status (admin only)
- `POST /api/payroll` - create payroll record (admin only)
- `POST /api/announcements` - create announcement (admin only)

## Notification Flow

- Leave status updates and announcements enqueue notification jobs.
- Jobs are stored in Redis and processed by a background worker.
- Emails are sent asynchronously through Nodemailer.
- Notifications are retried automatically and persisted in the database.

## Notes

- Admin actions are guarded with role-based middleware.
- Employee-specific endpoints require authentication.
- The app currently uses `nodemon` for development.

## License

This project is licensed under ISC.
