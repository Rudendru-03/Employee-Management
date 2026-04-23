const { z, idParamSchema } = require("./common");

const applyLeaveSchema = z.object({
  leaveType: z.enum(["sick", "casual", "paid"]),
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  reason: z.string().trim().min(5).max(500),
});

const leaveStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

module.exports = {
  idParamSchema,
  applyLeaveSchema,
  leaveStatusSchema,
};
