const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const Leave = require("../models/leave");
const { sendLeaveNotification } = require("../services/notificationService");
const { z } = require("../validations/common");
const { paginationQuerySchema } = require("../validations/pagination.validation");
const {
  parsePagination,
  buildEqualityFilter,
  buildPaginatedResult,
} = require("../utils/pagination");
const {
  idParamSchema,
  applyLeaveSchema,
  leaveStatusSchema,
} = require("../validations/leave.validation");

const router = express.Router();
const leaveListQuerySchema = paginationQuerySchema.extend({
  userId: z.string().optional(),
  leaveType: z.enum(["sick", "casual", "paid"]).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});
const leaveMeQuerySchema = paginationQuerySchema.extend({
  leaveType: z.enum(["sick", "casual", "paid"]).optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

router.use(auth);

router.post(
  "/",
  authorizeRoles("employee", "admin"),
  validate({ body: applyLeaveSchema }),
  async (req, res, next) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    const leave = await Leave.create({
      userId: req.user.id,
      leaveType,
      fromDate,
      toDate,
      reason,
      status: "pending",
    });

    return res.status(201).json({ message: "Leave applied successfully", leave });
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/",
  authorizeRoles("admin"),
  validate({ query: leaveListQuerySchema }),
  async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const filter = buildEqualityFilter(req.query, ["userId", "leaveType", "status"]);
    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("userId", "-password")
        .populate("approvedBy", "-password"),
      Leave.countDocuments(filter),
    ]);
    return res.json(buildPaginatedResult({ items: leaves, total, limit, offset }));
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/me",
  authorizeRoles("employee", "admin"),
  validate({ query: leaveMeQuerySchema }),
  async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const filter = {
      userId: req.user.id,
      ...buildEqualityFilter(req.query, ["leaveType", "status"]),
    };
    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .skip(offset)
        .limit(limit)
        .populate("approvedBy", "-password")
        .sort({ createdAt: -1 }),
      Leave.countDocuments(filter),
    ]);
    return res.json(buildPaginatedResult({ items: leaves, total, limit, offset }));
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
    const leave = await Leave.findById(req.params.id)
      .populate("userId", "-password")
      .populate("approvedBy", "-password");
    if (!leave) return res.status(404).json({ message: "Leave request not found" });
    return res.json(leave);
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/:id/status",
  authorizeRoles("admin"),
  validate({ params: idParamSchema, body: leaveStatusSchema }),
  async (req, res, next) => {
  try {
    const { status } = req.body;

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, approvedBy: req.user.id },
      { new: true, runValidators: true },
    )
      .populate("userId", "-password")
      .populate("approvedBy", "-password");

    if (!leave) return res.status(404).json({ message: "Leave request not found" });
    await sendLeaveNotification(leave);
    return res.json({ message: "Leave status updated successfully", leave });
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
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });
    return res.json({ message: "Leave request deleted successfully" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
