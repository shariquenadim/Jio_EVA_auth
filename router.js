const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("./models/user");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const redis = require("redis");

const router = express.Router();

// Constants
const JWT_SECRET = "8Zz5tw0Ionm3XPZZfN0NOml3z9FMfmpgXwovR9fp6ryDIoGRM8EPHAB6iHsc0fb";
// I have to set this in .env file before production
const OTP_SECRET = "2o8Mky6F9DfwvM9J8Us1a46pTz";

// Initialize Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("connect", () => {
  console.log("Redis client connected");
});

redisClient.on("error", (err) => {
  console.error("Redis error", err);
});

// CORS configuration
const allowedOrigins = ['http://localhost:4200', 'http://localhost'];
// add the hosting url also for production

router.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Cookie parser middleware
router.use(cookieParser());

// Sign up route
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(401).json("Passwords do not match");
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

    if (existingUser) {
      console.log("User already exists");
      return res.status(400).json("User already exists");
    }

    const user = new User({
      name,
      email,
      phone,
      password,
    });

    await user.save();

    // Send verification email
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1d" });
    const url = `http://localhost:3000/verify-email?token=${token}`;
    // change the url according to the production

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: "Gmail",
      auth: {
        user: "infomotiveofficial@gmail.com",
        pass: "ipuszobdyygbwapv",
      },
    });

    await transporter.sendMail({
      from: "infomotiveofficial@gmail.com",
      to: email,
      subject: "Verify your Email ID for JIO EVA",
      html: `Click <strong><a href="${url}">here</a></strong> to verify your email address. <br> Please don't share this email with others.`,
    });

    res.status(201).json({ status: 201, message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred during signup" });
  }
});

// Verify email route
router.get("/verify-email", async (req, res, next) => {
  try {
    const { token } = req.query;
    const { email } = jwt.verify(token, JWT_SECRET);

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json("Invalid token");
    }

    user.emailVerified = true;

    await user.save();

    res.json("Email verified successfully");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred during email verification" });
  }
});

// Login route
router.post("/login", async (req, res, next) => {
  console.log('Login route called');
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found.");
      return res.status(400).json("User not found");
    }

    if (!user.emailVerified) {
      console.log("Email address not verified");
      return res.status(400).json("Email address not verified");
    }

    user.comparePassword(password, async (err, isMatch) => {
      if (err || !isMatch) {
        console.log("Invalid email or password");
        return res.status(400).json("Invalid email or password");
      }

      // Generate OTP code
      const otp = Math.floor(100000 + Math.random() * 900000);

      // Store OTP code in Redis database
      const timestamp = Date.now();
      const otpKey = `otp:${email}`;

      redisClient.set(otpKey, otp.toString(), "EX", 120); // Set OTP with a 2-minute expiration time

      // Set rememberMe option if true
      if (rememberMe) {
        res.cookie("rememberMe", rememberMe.toString(), { httpOnly: true });
      }

      res.cookie("email", email.toString(), { httpOnly: true });

      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        service: "Gmail",
        auth: {
          user: "infomotiveofficial@gmail.com",
          pass: "ipuszobdyygbwapv",
        },
      });

      await transporter.sendMail({
        from: "infomotiveofficial@gmail.com",
        to: email,
        subject: "OTP For Login in Jio EVA",
        html: `Your new OTP code is <strong>${otp}</strong>. This OTP is active only for 2 minutes.`,
      });

      res.status(200).json({ message: "An OTP has been sent to your email" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred during login" });
  }
});

// OTP verification route
router.post('/otp', async (req, res) => {
  const { otp } = req.body;
  const email = req.cookies.email;
  const otpKey = `otp:${email}`;

  try {
    redisClient.get(otpKey, (err, prevOtp) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "An error occurred during OTP verification" });
      }

      // Check if OTP is valid
      if (otp !== prevOtp) {
        console.log("Invalid OTP");
        return res.status(401).json({ message: 'Invalid OTP' });
      }

      // Check if OTP is expired
      const now = Date.now();
      redisClient.ttl(otpKey, (err, ttl) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "An error occurred during OTP verification" });
        }

        if (ttl === -2 || now - ttl > 2 * 60 * 1000) {
          console.log("OTP expired");
          return res.status(401).json({ message: 'OTP expired' });
        }

        const token = jwt.sign({ email: email }, JWT_SECRET, { expiresIn: "1d" });
        res.cookie("token", token, { httpOnly: true });

        // Successful login
        res.status(200).json({ token, message: 'Login successful' });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred during OTP verification" });
  }
});

// Logout route
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json("Logged out successfully");
});

// Get current user route
router.get("/me", async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json("Unauthorized");
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded) {
      return res.status(401).json("Unauthorized");
    }

    const { email } = decoded;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json("User does not exist");
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred while fetching user details" });
  }
});

module.exports = router;
