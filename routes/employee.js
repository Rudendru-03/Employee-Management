const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const Employee = require("../models/employee");

const router = express.Router();

router.use(auth, authorizeRoles("employee", "admin"));

router.get("/me", async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id })
      .populate("userId", "-password")
      .populate("department")
      .populate("reportingManager", "-password");
    if (!employee) return res.status(404).json({ message: "Employee profile not found" });
    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch("/me", async (req, res) => {
  try {
    const allowedFields = [
      "dateOfBirth",
      "gender",
      "phoneNumber",
      "emergencyContact",
      "photoUrl",
      "documents",
      "bankDetails",
      "bankName",
      "bankAccountNumber",
      "bankAccountHolderName",
      "bankAccountHolderAddress",
      "workLocation",
    ];

    const updates = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) updates[key] = req.body[key];
    });

    const employee = await Employee.findOneAndUpdate(
      { userId: req.user.id },
      updates,
      { new: true, runValidators: true },
    );

    if (!employee) return res.status(404).json({ message: "Employee profile not found" });
    return res.json({ message: "Profile updated successfully", employee });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/me/photo", async (req, res) => {
  try {
    const { photoUrl } = req.body;
    if (!photoUrl) return res.status(400).json({ message: "photoUrl is required" });

    const employee = await Employee.findOneAndUpdate(
      { userId: req.user.id },
      { photoUrl },
      { new: true, runValidators: true },
    );
    if (!employee) return res.status(404).json({ message: "Employee profile not found" });
    return res.json({ message: "Photo updated successfully", employee });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
