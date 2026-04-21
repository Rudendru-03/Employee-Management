const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: Date, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "leave", "holiday"],
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Attendance", attendanceSchema);
