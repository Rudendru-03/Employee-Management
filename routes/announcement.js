const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const Announcement = require("../models/announcement");
const Department = require("../models/department");
const Employee = require("../models/employee");
const { z } = require("../validations/common");
const { paginationQuerySchema } = require("../validations/pagination.validation");
const {
  parsePagination,
  buildEqualityFilter,
  buildPaginatedResult,
} = require("../utils/pagination");
const {
  idParamSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} = require("../validations/announcement.validation");

const router = express.Router();
const announcementListQuerySchema = paginationQuerySchema.extend({
  title: z.string().optional(),
  target: z.enum(["all", "department", "employee"]).optional(),
  department: z.string().optional(),
  createdBy: z.string().optional(),
});
const announcementMeQuerySchema = paginationQuerySchema.extend({
  title: z.string().optional(),
  target: z.enum(["all", "department", "employee"]).optional(),
});

router.use(auth);

router.post(
  "/",
  authorizeRoles("admin"),
  validate({ body: createAnnouncementSchema }),
  async (req, res, next) => {
  try {
    const { title, description, target, department } = req.body;
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
    return next(error);
  }
});

router.get(
  "/",
  authorizeRoles("admin"),
  validate({ query: announcementListQuerySchema }),
  async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const filter = buildEqualityFilter(req.query, [
      "title",
      "target",
      "department",
      "createdBy",
    ]);
    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("createdBy", "-password")
        .populate("department"),
      Announcement.countDocuments(filter),
    ]);
    return res.json(
      buildPaginatedResult({
        items: announcements,
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
  validate({ query: announcementMeQuerySchema }),
  async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const employee = await Employee.findOne({ userId: req.user.id }).select("department");
    const departmentId = employee?.department || null;
    const visibilityFilter = {
      $or: [
        { target: "all" },
        { target: "employee" },
        ...(departmentId ? [{ target: "department", department: departmentId }] : []),
      ],
    };
    const extraFilter = buildEqualityFilter(req.query, ["title", "target"]);
    const finalFilter = { ...visibilityFilter, ...extraFilter };
    const [announcements, total] = await Promise.all([
      Announcement.find(finalFilter)
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate("createdBy", "-password")
        .populate("department"),
      Announcement.countDocuments(finalFilter),
    ]);
    return res.json(buildPaginatedResult({ items: announcements, total, limit, offset }));
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
    const announcement = await Announcement.findById(req.params.id)
      .populate("createdBy", "-password")
      .populate("department");
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });
    return res.json(announcement);
  } catch (error) {
    return next(error);
  }
});

router.put(
  "/:id",
  authorizeRoles("admin"),
  validate({ params: idParamSchema, body: updateAnnouncementSchema }),
  async (req, res, next) => {
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
    return next(error);
  }
});

router.delete(
  "/:id",
  authorizeRoles("admin"),
  validate({ params: idParamSchema }),
  async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });
    return res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
