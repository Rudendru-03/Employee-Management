const { z, objectId, idParamSchema } = require("./common");

const createPayrollSchema = z.object({
  userId: objectId,
  month: z.string().trim().min(3).max(30),
  basicSalary: z.number().nonnegative().optional().default(0),
  deductions: z.number().nonnegative().optional().default(0),
  bonus: z.number().nonnegative().optional().default(0),
});

const updatePayrollSchema = z
  .object({
    userId: objectId.optional(),
    month: z.string().trim().min(3).max(30).optional(),
    basicSalary: z.number().nonnegative().optional(),
    deductions: z.number().nonnegative().optional(),
    bonus: z.number().nonnegative().optional(),
    netSalary: z.number().nonnegative().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  });

module.exports = {
  idParamSchema,
  createPayrollSchema,
  updatePayrollSchema,
};
