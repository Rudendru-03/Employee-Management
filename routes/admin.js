const express = require("express");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const User = require("../models/user");
const Employee = require("../models/employee");
const Department = require("../models/department");

const router = express.Router();

router.use(auth, authorizeRoles("admin"));

router.post("/users", async (req, res) => {
  try {
    const { username, email, password, role = "employee", status = "active" } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "username, email and password are required" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      status,
      mustChangePassword: true,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/employees", async (req, res) => {
  try {
    const { userId, employeeId, department, reportingManager } = req.body;
    if (!userId || !employeeId || !department || !reportingManager) {
      return res.status(400).json({
        message: "userId, employeeId, department and reportingManager are required",
      });
    }

    const [user, departmentDoc, manager] = await Promise.all([
      User.findById(userId),
      Department.findById(department),
      User.findById(reportingManager),
    ]);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!departmentDoc) return res.status(404).json({ message: "Department not found" });
    if (!manager) return res.status(404).json({ message: "Reporting manager not found" });

    const employee = await Employee.create(req.body);
    return res.status(201).json({ message: "Employee created successfully", employee });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    return res.json({ message: "Employee updated successfully", employee });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/employees", async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId", "-password")
      .populate("department")
      .populate("reportingManager", "-password");
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/employees/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("userId", "-password")
      .populate("department")
      .populate("reportingManager", "-password");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    return res.json(employee);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be active or inactive" });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ message: "User status updated", user });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
