const express = require("express");
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const User = require("../models/user");
const Employee = require("../models/employee");
const Department = require("../models/department");
const { z } = require("../validations/common");
const { paginationQuerySchema } = require("../validations/pagination.validation");
const {
  parsePagination,
  buildEqualityFilter,
  buildPaginatedResult,
} = require("../utils/pagination");
const {
  idParamSchema,
  createUserSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  updateUserStatusSchema,
} = require("../validations/admin.validation");

const router = express.Router();
const employeeListQuerySchema = paginationQuerySchema.extend({
  userId: z.string().optional(),
  employeeId: z.string().optional(),
  department: z.string().optional(),
  reportingManager: z.string().optional(),
  employmentType: z.string().optional(),
  workLocation: z.string().optional(),
  gender: z.string().optional(),
});

router.use(auth, authorizeRoles("admin"));

router.post("/users", validate({ body: createUserSchema }), async (req, res, next) => {
  try {
    const { username, email, password, role = "employee", status = "active" } = req.body;
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
    return next(error);
  }
});

router.post("/employees", validate({ body: createEmployeeSchema }), async (req, res, next) => {
  try {
    const { userId, employeeId, department, reportingManager } = req.body;
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
    return next(error);
  }
});

router.put(
  "/employees/:id",
  validate({ params: idParamSchema, body: updateEmployeeSchema }),
  async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    return res.json({ message: "Employee updated successfully", employee });
  } catch (error) {
    return next(error);
  }
});

router.get(
  "/employees",
  validate({ query: employeeListQuerySchema }),
  async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const filter = buildEqualityFilter(req.query, [
      "userId",
      "employeeId",
      "department",
      "reportingManager",
      "employmentType",
      "workLocation",
      "gender",
    ]);
    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("userId", "-password")
        .populate("department")
        .populate("reportingManager", "-password"),
      Employee.countDocuments(filter),
    ]);
    return res.json(
      buildPaginatedResult({
        items: employees,
        total,
        limit,
        offset,
      }),
    );
  } catch (error) {
    return next(error);
  }
});

router.get("/employees/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("userId", "-password")
      .populate("department")
      .populate("reportingManager", "-password");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    return res.json(employee);
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/users/:id/status",
  validate({ params: idParamSchema, body: updateUserStatusSchema }),
  async (req, res, next) => {
  try {
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    ).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ message: "User status updated", user });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
