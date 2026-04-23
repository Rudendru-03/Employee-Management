const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const Department = require("../models/department");
const User = require("../models/user");
const Employee = require("../models/employee");
const {
  idParamSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
} = require("../validations/department.validation");

const router = express.Router();

router.use(auth, authorizeRoles("admin"));

router.post("/", validate({ body: createDepartmentSchema }), async (req, res) => {
  try {
    const { name, description, manager } = req.body;
    const managerUser = await User.findById(manager);
    if (!managerUser) {
      return res.status(404).json({ message: "Manager user not found" });
    }

    const department = await Department.create({ name, description, manager });
    return res.status(201).json({ message: "Department created successfully", department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Department name already exists" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const departments = await Department.find().populate("manager", "-password");
    return res.json(departments);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:id", validate({ params: idParamSchema }), async (req, res) => {
  try {
    const department = await Department.findById(req.params.id).populate(
      "manager",
      "-password",
    );
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    return res.json(department);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put(
  "/:id",
  validate({ params: idParamSchema, body: updateDepartmentSchema }),
  async (req, res) => {
  try {
    const { manager } = req.body;
    if (manager) {
      const managerUser = await User.findById(manager);
      if (!managerUser) {
        return res.status(404).json({ message: "Manager user not found" });
      }
    }

    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("manager", "-password");
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    return res.json({ message: "Department updated successfully", department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Department name already exists" });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", validate({ params: idParamSchema }), async (req, res) => {
  try {
    const employeesCount = await Employee.countDocuments({ department: req.params.id });
    if (employeesCount > 0) {
      return res.status(400).json({
        message: "Department cannot be deleted because employees are assigned to it",
      });
    }

    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    return res.json({ message: "Department deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
