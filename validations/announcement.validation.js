const { z, objectId, idParamSchema } = require("./common");

const announcementSchemaBase = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(5).max(1000),
  target: z.enum(["all", "department", "employee"]),
  department: objectId.optional(),
});

const createAnnouncementSchema = announcementSchemaBase
  .superRefine((value, ctx) => {
    if (value.target === "department" && !value.department) {
      ctx.addIssue({
        code: "custom",
        path: ["department"],
        message: "department is required when target is department",
      });
    }
  });

const updateAnnouncementSchema = announcementSchemaBase
  .partial()
  .superRefine((value, ctx) => {
    if (Object.keys(value).length === 0) {
      ctx.addIssue({
        code: "custom",
        path: [],
        message: "At least one field is required for update",
      });
    }
    if (value.target === "department" && !value.department) {
      ctx.addIssue({
        code: "custom",
        path: ["department"],
        message: "department is required when target is department",
      });
    }
  });

module.exports = {
  idParamSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
};
