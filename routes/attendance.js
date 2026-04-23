const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const Attendance = require("../models/attendance");
const User = require("../models/user");
const { z } = require("../validations/common");
const { paginationQuerySchema } = require("../validations/pagination.validation");
const {
  parsePagination,
  buildEqualityFilter,
  buildPaginatedResult,
} = require("../utils/pagination");
const {
  idParamSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
} = require("../validations/attendance.validation");

const router = express.Router();
const attendanceListQuerySchema = paginationQuerySchema.extend({
  userId: z.string().optional(),
  status: z.enum(["present", "absent", "leave", "holiday"]).optional(),
  date: z.string().optional(),
});
const attendanceMeQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["present", "absent", "leave", "holiday"]).optional(),
  date: z.string().optional(),
});

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

router.get(
  "/",
  authorizeRoles("admin"),
  validate({ query: attendanceListQuerySchema }),
  async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const filter = buildEqualityFilter(req.query, ["userId", "status", "date"]);
    const [attendanceRecords, total] = await Promise.all([
      Attendance.find(filter)
        .skip(offset)
        .limit(limit)
        .sort({ date: -1 })
        .populate("userId", "-password"),
      Attendance.countDocuments(filter),
    ]);
    return res.json(
      buildPaginatedResult({
        items: attendanceRecords,
        total,
        limit,
        offset,
      }),
    );
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/me",
  authorizeRoles("employee", "admin"),
  validate({ query: attendanceMeQuerySchema }),
  async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const filter = {
      userId: req.user.id,
      ...buildEqualityFilter(req.query, ["status", "date"]),
    };
    const [attendanceRecords, total] = await Promise.all([
      Attendance.find(filter).skip(offset).limit(limit).sort({ date: -1 }),
      Attendance.countDocuments(filter),
    ]);
    return res.json(
      buildPaginatedResult({
        items: attendanceRecords,
        total,
        limit,
        offset,
      }),
    );
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
