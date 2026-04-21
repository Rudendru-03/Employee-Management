const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [schema, tokenFromHeader] = authHeader.split(" ");
  const tokenFromCookie = req.cookies?.access_token;

  const token = schema === "Bearer" ? tokenFromHeader : tokenFromCookie;
  if (schema !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ message: "Missing or invalid authorization header" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = auth;
