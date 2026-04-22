const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const Announcement = require("../models/announcement");
const Department = require("../models/department");
const Employee = require("../models/employee");

const router = express.Router();

router.use(auth);

router.post("/", authorizeRoles("admin"), async (req, res) => {
  try {
    const { title, description, target, department } = req.body;
    if (!title || !description || !target) {
      return res
        .status(400)
        .json({ message: "title, description and target are required" });
    }

    if (target === "department") {
      if (!department) {
        return res
          .status(400)
          .json({ message: "department is required when target is department" });
      }
      const dept = await Department.findById(department);
      if (!dept) return res.status(404).json({ message: "Department not found" });
    }

    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user.id,
    });
    return res
      .status(201)
      .json({ message: "Announcement created successfully", announcement });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/", authorizeRoles("admin"), async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate("createdBy", "-password")
      .populate("department");
    return res.json(announcements);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/me", authorizeRoles("employee", "admin"), async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id }).select("department");
    const departmentId = employee?.department || null;

    const announcements = await Announcement.find({
      $or: [
        { target: "all" },
        { target: "employee" },
        ...(departmentId ? [{ target: "department", department: departmentId }] : []),
      ],
    })
      .populate("createdBy", "-password")
      .populate("department");

    return res.json(announcements);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("createdBy", "-password")
      .populate("department");
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });
    return res.json(announcement);
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const { target, department } = req.body;
    if (target === "department") {
      if (!department) {
        return res
          .status(400)
          .json({ message: "department is required when target is department" });
      }
      const dept = await Department.findById(department);
      if (!dept) return res.status(404).json({ message: "Department not found" });
    }

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("createdBy", "-password")
      .populate("department");

    if (!announcement) return res.status(404).json({ message: "Announcement not found" });
    return res.json({ message: "Announcement updated successfully", announcement });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });
    return res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
