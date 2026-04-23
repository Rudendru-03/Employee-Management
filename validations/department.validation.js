const { z, objectId, idParamSchema } = require("./common");

const createDepartmentSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(500),
  manager: objectId,
});

const updateDepartmentSchema = createDepartmentSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required for update" },
);

module.exports = {
  idParamSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
};
