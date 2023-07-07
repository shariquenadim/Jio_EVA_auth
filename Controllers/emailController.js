// emailController.js

const jwt = require("jsonwebtoken");
const User = require("../models/user");
const path = require("path");
const fs = require("fs");


const JWT_SECRET = "8Zz5tw0Ionm3XPZZfN0NOml3z9FMfmpgXwovR9fp6ryDIoGRM8EPHAB6iHsc0fb";

// Verify email route
exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { email } = jwt.verify(token, JWT_SECRET);

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json("Invalid token");
    }

    user.emailVerified = true;

    await user.save();

    // Read the HTML file and send it as the response
    const filePath = path.join(__dirname, "../views/email-verification-success.html");
    const html = fs.readFileSync(filePath, "utf-8");
    res.send(html.replace("{{email}}", email));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred during email verification" });
  }
};

// OTP verification route
exports.verifyOTP = async (req, res) => {
  const { otp } = req.body;
  const email = req.cookies.email;

  // Get OTP from server cookie
  const prevOtp = req.cookies.otp;

  // Check if OTP is valid
  if (otp !== prevOtp) {
    console.log("Invalid OTP");
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  // Check if OTP is expired (2-minute expiration time)
  const now = Date.now();
  const expirationTime = 2 * 60 * 1000; // 2 minutes
  if (now - parseInt(req.cookies.otp_time) > expirationTime) {
    console.log("OTP expired");
    return res.status(401).json({ message: 'OTP expired' });
  }

  const token = jwt.sign({ email: email }, JWT_SECRET, { expiresIn: "1d" });
  res.cookie("token", token, { httpOnly: true });

  // Successful login
  res.status(200).json({ token, message: 'Login successful' });
};
