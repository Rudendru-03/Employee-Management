const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: { type: String, required: true, unique: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    designation: { type: String, required: false },
    joiningDate: { type: Date, required: false },
    salary: { type: Number, default: 0 },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "intern"],
      default: "full-time",
    },
    workLocation: {
      type: String,
      enum: ["office", "remote"],
      default: "office",
    },
    dateOfBirth: { type: Date, required: false },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
    },
    phoneNumber: { type: String, required: false },
    emergencyContact: { type: String, required: false },
    photoUrl: { type: String, required: false },
    documents: [{ type: String, required: false }],
    bankDetails: {
      type: String,
      enum: ["bank", "upi", "cash"],
      default: "bank",
    },
    bankName: { type: String, required: false },
    bankAccountNumber: { type: String, required: false },
    bankAccountHolderName: { type: String, required: false },
    bankAccountHolderAddress: { type: String, required: false },
  },
  { timestamps: true },
);

employeeSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("Employee", employeeSchema);
