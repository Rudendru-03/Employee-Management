const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const Leave = require("../models/leave");

const router = express.Router();

router.use(auth);

router.post("/", authorizeRoles("employee", "admin"), async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;
    if (!leaveType || !fromDate || !toDate || !reason) {
      return res
        .status(400)
        .json({ message: "leaveType, fromDate, toDate and reason are required" });
    }

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
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/", authorizeRoles("admin"), async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate("userId", "-password")
      .populate("approvedBy", "-password");
    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/me", authorizeRoles("employee", "admin"), async (req, res) => {
  try {
    const leaves = await Leave.find({ userId: req.user.id })
      .populate("approvedBy", "-password")
      .sort({ createdAt: -1 });
    return res.json(leaves);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("userId", "-password")
      .populate("approvedBy", "-password");
    if (!leave) return res.status(404).json({ message: "Leave request not found" });
    return res.json(leave);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch("/:id/status", authorizeRoles("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be approved, rejected or pending" });
    }

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, approvedBy: req.user.id },
      { new: true, runValidators: true },
    )
      .populate("userId", "-password")
      .populate("approvedBy", "-password");

    if (!leave) return res.status(404).json({ message: "Leave request not found" });
    return res.json({ message: "Leave status updated successfully", leave });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });
    return res.json({ message: "Leave request deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
