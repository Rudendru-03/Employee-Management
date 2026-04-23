const { z } = require("./common");

const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

module.exports = {
  paginationQuerySchema,
};
