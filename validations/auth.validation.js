const { z } = require("./common");

const registerSchema = z
  .object({
    username: z.string().trim().min(3).max(50),
    email: z.string().email().toLowerCase(),
    password: z.string().min(6).max(128),
    role: z.enum(["admin", "employee"]).optional().default("employee"),
    adminSecret: z.string().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "admin" && !value.adminSecret) {
      ctx.addIssue({
        code: "custom",
        message: "adminSecret is required when role is admin",
        path: ["adminSecret"],
      });
    }
  });

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(128),
});

module.exports = {
  registerSchema,
  loginSchema,
  changePasswordSchema,
};
