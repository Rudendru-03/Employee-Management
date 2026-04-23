const express = require("express");
const auth = require("../middleware/auth");
const authorizeRoles = require("../middleware/authorize");
const validate = require("../middleware/validate");
const Payroll = require("../models/payroll");
const User = require("../models/user");
const {
  idParamSchema,
  createPayrollSchema,
  updatePayrollSchema,
} = require("../validations/payroll.validation");

const router = express.Router();

router.use(auth);

router.post(
  "/",
  authorizeRoles("admin"),
  validate({ body: createPayrollSchema }),
  async (req, res, next) => {
  try {
    const { userId, month, basicSalary = 0, deductions = 0, bonus = 0 } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const netSalary = Number(basicSalary) + Number(bonus) - Number(deductions);
    const payroll = await Payroll.create({
      userId,
      month,
      basicSalary,
      deductions,
      bonus,
      netSalary,
    });
    return res.status(201).json({ message: "Payroll created successfully", payroll });
  } catch (error) {
    return next(error);
  }
});

router.get("/", authorizeRoles("admin"), async (req, res, next) => {
  try {
    const payrolls = await Payroll.find().populate("userId", "-password");
    return res.json(payrolls);
  } catch (error) {
    return next(error);
  }
});

router.get("/me", authorizeRoles("employee", "admin"), async (req, res, next) => {
  try {
    const payrolls = await Payroll.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(payrolls);
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
    const payroll = await Payroll.findById(req.params.id).populate("userId", "-password");
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });
    return res.json(payroll);
  } catch (error) {
    return next(error);
  }
});

router.put(
  "/:id",
  authorizeRoles("admin"),
  validate({ params: idParamSchema, body: updatePayrollSchema }),
  async (req, res, next) => {
  try {
    const { basicSalary, deductions, bonus } = req.body;
    const updates = { ...req.body };
    if (
      basicSalary !== undefined ||
      deductions !== undefined ||
      bonus !== undefined
    ) {
      const current = await Payroll.findById(req.params.id);
      if (!current) return res.status(404).json({ message: "Payroll not found" });
      const nextBasic = basicSalary !== undefined ? basicSalary : current.basicSalary;
      const nextDeductions = deductions !== undefined ? deductions : current.deductions;
      const nextBonus = bonus !== undefined ? bonus : current.bonus;
      updates.netSalary =
        Number(nextBasic) + Number(nextBonus) - Number(nextDeductions);
    }

    const payroll = await Payroll.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).populate("userId", "-password");
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });
    return res.json({ message: "Payroll updated successfully", payroll });
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
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });
    return res.json({ message: "Payroll deleted successfully" });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
