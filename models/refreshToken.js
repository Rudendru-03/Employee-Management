const moongoose = require("mongoose");

const refreshTokenSchema = new moongoose.Schema({
  userId: {
    type: moongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tokenHash: { type: String, required: true, unique: true },
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Date, default: null },
  replacedBy: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  ip: { type: String },
  userAgent: { type: String },
});

module.exports = moongoose.model("RefreshToken", refreshTokenSchema);
