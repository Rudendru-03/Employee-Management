const { z } = require("zod");

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");

const idParamSchema = z.object({
  id: objectId,
});

module.exports = {
  z,
  objectId,
  idParamSchema,
};
