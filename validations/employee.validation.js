const { z } = require("./common");

const updateMeSchema = z
  .object({
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
    workLocation: z.enum(["office", "remote"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  });

const updatePhotoSchema = z.object({
  photoUrl: z.string().url(),
});

module.exports = {
  updateMeSchema,
  updatePhotoSchema,
};
