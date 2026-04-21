const express = require("express");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB();

app.get("/", (req, res) => {
  res.send("Hello From Employee Management System");
  // res.json({
  //   message: "Hello From Employee Management System",
  // });
});
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);
});
