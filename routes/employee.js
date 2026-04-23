const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const Employee = require("../models/employee");
const { updateMeSchema, updatePhotoSchema } = require("../validations/employee.validation");

const router = express.Router();

router.use(auth, authorizeRoles("employee", "admin"));

router.get("/me", async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id })
      .populate("userId", "-password")
      .populate("department")
      .populate("reportingManager", "-password");
    if (!employee) return res.status(404).json({ message: "Employee profile not found" });
    return res.json(employee);
  } catch (error) {
    return next(error);
  }
});

router.patch("/me", validate({ body: updateMeSchema }), async (req, res, next) => {
  try {
    const employee = await Employee.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, runValidators: true },
    );

    if (!employee) return res.status(404).json({ message: "Employee profile not found" });
    return res.json({ message: "Profile updated successfully", employee });
  } catch (error) {
    return next(error);
  }
});

router.post("/me/photo", validate({ body: updatePhotoSchema }), async (req, res, next) => {
  try {
    const { photoUrl } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { userId: req.user.id },
      { photoUrl },
      { new: true, runValidators: true },
    );
    if (!employee) return res.status(404).json({ message: "Employee profile not found" });
    return res.json({ message: "Photo updated successfully", employee });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
