const { z, objectId, idParamSchema } = require("./common");

const createAttendanceSchema = z.object({
  userId: objectId,
  date: z.coerce.date(),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  status: z.enum(["present", "absent", "leave", "holiday"]),
});

const updateAttendanceSchema = createAttendanceSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "At least one field is required for update" },
);

module.exports = {
  idParamSchema,
  createAttendanceSchema,
  updateAttendanceSchema,
};
