const { z, objectId, idParamSchema } = require("./common");

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(50),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(128),
  role: z.enum(["admin", "employee"]).optional().default("employee"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
});

const createEmployeeSchema = z.object({
  userId: objectId,
  employeeId: z.string().trim().min(2).max(30),
  department: objectId,
  designation: z.string().trim().min(2).max(100).optional(),
  joiningDate: z.coerce.date().optional(),
  salary: z.number().nonnegative().optional(),
  reportingManager: objectId,
  employmentType: z.enum(["full-time", "part-time", "contract", "intern"]).optional(),
  workLocation: z.enum(["office", "remote"]).optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  phoneNumber: z.string().trim().min(7).max(20).optional(),
  emergencyContact: z.string().trim().min(2).max(100).optional(),
  photoUrl: z.string().url().optional(),
  documents: z.array(z.string().url()).optional(),
  bankDetails: z.enum(["bank", "upi", "cash"]).optional(),
  bankName: z.string().trim().min(2).max(100).optional(),
  bankAccountNumber: z.string().trim().min(5).max(34).optional(),
  bankAccountHolderName: z.string().trim().min(2).max(100).optional(),
  bankAccountHolderAddress: z.string().trim().min(5).max(255).optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required for update" },
);

const updateUserStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

module.exports = {
  idParamSchema,
  createUserSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  updateUserStatusSchema,
};
