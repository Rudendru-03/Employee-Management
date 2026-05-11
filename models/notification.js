// models/notification.js - ADD THESE FIELDS
const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: ["leave_approval", "announcement", "reminder", "alert"],
    },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "retrying", "sent", "failed"],
      default: "queued",
    },
    metadata: { type: Object, default: {} },
    error: { type: String },
    sentAt: { type: Date },
    
    // NEW FIELDS for better tracking
    retryCount: { type: Number, default: 0 },
    lastAttemptAt: { type: Date },
    externalId: { type: String }, // SendGrid message ID
    movedToDLQ: { type: Boolean, default: false },
    failedAt: { type: Date },
    priority: { type: Number, default: 5 }, // 1-10, lower = higher priority
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });