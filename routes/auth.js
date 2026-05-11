const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Employee = require("../models/employee");
const RefreshToken = require("../models/refreshToken");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { authLimiter, loginLimiter } = require("../middleware/rateLimit");
const logger = require("../utils/logger");
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} = require("../validations/auth.validation");
const {
  createJti,
  signAccessToken,
  signRefreshToken,
  persistRefreshToken,
  setRefreshCookie,
  hashToken,
  rotateRefreshToken,
} = require("../utils/tokens");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validate({ body: registerSchema }),
  async (req, res, next) => {
    try {
      const {
        username,
        email,
        password,
        role = "employee",
        adminSecret,
      } = req.body;
      const exitingUser = await User.findOne({ email });
      if (exitingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      let resolvedRole = "employee";
      if (role === "admin") {
        if (
          !process.env.ADMIN_REGISTER_SECRET ||
          adminSecret !== process.env.ADMIN_REGISTER_SECRET
        ) {
          return res
            .status(403)
            .json({ message: "Invalid admin registration secret" });
        }
        resolvedRole = "admin";
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        role: resolvedRole,
      });
      await newUser.save();
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/login",
  loginLimiter,
  validate({ body: loginSchema }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        logger.warn("Invalid login attempt", {
          email,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          reason: "User not found",
        });
        return res.status(400).json({ message: "Invalid email or password" });
      }
      // if (user.status !== "active") {
      //   logger.warn("Blocked login attempt", {
      //     userId: user._id.toString(),
      //     email: user.email,
      //     ip: req.ip,
      //     userAgent: req.headers["user-agent"],
      //     reason: "Inactive account",
      //   });
      //   return res.status(403).json({ message: "User account is inactive" });
      // }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        logger.warn("Invalid login attempt", {
          userId: user._id?.toString(),
          email: user.email,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          reason: "Invalid password",
        });
        return res.status(400).json({ message: "Invalid password" });
      }

      // 🔹 Fetch employee record and populate department
      const employee = await Employee.findOne({ userId: user._id }).populate(
        "department",
        "name",
      );
      
      const accessToken = signAccessToken(user, employee?.department?.name);
      const jti = createJti();
      const refreshToken = signRefreshToken(user, jti);
      await persistRefreshToken({
        user,
        refreshToken,
        jti,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      setRefreshCookie(res, refreshToken);
      user.lastLoginAt = new Date();
      await user.save();

      logger.info("User logged in", {
        userId: user._id.toString(),
        email: user.email,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });

      res.json({ accessToken, mustChangePassword: user.mustChangePassword });
    } catch (error) {
      logger.error("Login error", {
        message: error.message,
        stack: error.stack,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      });
      next(error);
    }
  },
);

router.post(
  "/change-password",
  authLimiter,
  auth,
  validate({ body: changePasswordSchema }),
  async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.mustChangePassword = false;
      await user.save();

      return res.json({ message: "Password changed successfully" });
    } catch (error) {
      return next(error);
    }
  },
);

router.post("/refresh", authLimiter, async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token" });
    }

    const tokenHash = hashToken(token);
    const doc = await RefreshToken.findOne({
      tokenHash,
      jti: decoded.jti,
    }).populate("userId");

    if (!doc) {
      return res.status(401).json({ message: "Refresh token not recognized" });
    }
    if (doc.revoked) {
      return res.status(401).json({ message: "Refresh token revoked" });
    }
    if (doc.expiresAt < new Date()) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    const result = await rotateRefreshToken(doc, doc.userId, req, res);
    return res.json({ accessToken: result.accessToken });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", authLimiter, async (req, res, next) => {
  try {
    const token = req.cookies?.refresh_token;
    if (token) {
      const tokenHash = hashToken(token);
      const doc = await RefreshToken.findOne({ tokenHash });
      if (doc && !doc.revoked) {
        doc.revoked = new Date();
        await doc.save();
      }
    }
    res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
