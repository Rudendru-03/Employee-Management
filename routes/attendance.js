const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const Attendance = require("../models/attendance");
const User = require("../models/user");
const {
  idParamSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
} = require("../validations/attendance.validation");

const router = express.Router();

router.use(auth);

router.post(
  "/",
  authorizeRoles("admin"),
  validate({ body: createAttendanceSchema }),
  async (req, res, next) => {
  try {
    const { userId, date, checkIn, checkOut, status } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const attendance = await Attendance.create(req.body);
    return res.status(201).json({ message: "Attendance created successfully", attendance });
  } catch (error) {
    return next(error);
  }
});

router.get("/", authorizeRoles("admin"), async (req, res, next) => {
  try {
    const attendanceRecords = await Attendance.find().populate("userId", "-password");
    return res.json(attendanceRecords);
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authorizeRoles("employee", "admin"), async (req, res, next) => {
  try {
    const attendanceRecords = await Attendance.find({ userId: req.user.id }).sort({
      date: -1,
    });
    return res.json(attendanceRecords);
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/:id",
  authorizeRoles("admin"),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
  try {
    const attendance = await Attendance.findById(req.params.id).populate(
      "userId",
      "-password",
    );
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });
    return res.json(attendance);
  } catch (error) {
    return next(error);
  }
});

router.put(
  "/:id",
  authorizeRoles("admin"),
  validate({ params: idParamSchema, body: updateAttendanceSchema }),
  async (req, res, next) => {
  try {
    const attendance = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });
    return res.json({ message: "Attendance updated successfully", attendance });
  } catch (error) {
    return next(error);
  }
});

router.delete(
  "/:id",
  authorizeRoles("admin"),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    if (!attendance) return res.status(404).json({ message: "Attendance not found" });
    return res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
