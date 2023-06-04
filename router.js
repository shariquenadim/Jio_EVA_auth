const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("./models/user");
const cors = require('cors');
const cookieParser = require('cookie-parser');

const router = express.Router();

const JWT_SECRET = "8Zz5tw0Ionm3XPZZfN0NOml3z9FMfmpgXwovR9fp6ryDIoGRM8EPHAB6iHsc0fb";
const OTP_SECRET = "2o8Mky6F9DfwvM9J8Us1a46pTz";

const redis = require("redis");

// Initialize redis client
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


const allowedOrigins = ['http://localhost:4200', 'http://localhost'];

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
      console.log("User already exists")
      return res.status(400).json("User already exist");
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
      html: `Click <strong><a href="${url}">here</a></strong> to verify your email address. <br> Please don't share this mail with others.`,
    });

    res.status(201).json({ status: 201, message: "User created successfully" });
  } catch (err) {
    next(err);
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
    next(err);
  }
});

// login route
router.post("/login", async (req, res, next) => {
  console.log('Login route called');
  try {
    const { email, password, rememberMe } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found.")
      return res.status(400).json("User not found.");
    }

    if (!user.emailVerified) {
      console.log("Email address not verified")
      return res.status(400).json("Email address not verified");
    }
    

    user.comparePassword(password, async (err, isMatch) => {
      if (err || !isMatch) {
        console.log("Invalid email or password")
        return res.status(400).json("Invalid email or password");
      }
      

      // Generate OTP code
      const otp = Math.floor(100000 + Math.random() * 900000);

      // Store OTP code in database
      const timestamp = Date.now();

      // Set rememberMe option if true
      if (rememberMe) {
        res.cookie("rememberMe", rememberMe.toString(), { httpOnly: true });
      }

      res.cookie("otp", otp.toString(), { httpOnly: true });
      res.cookie("timestamp", timestamp.toString(), { httpOnly: true });
      res.cookie("email", email.toString(), { httpOnly: true });
      console.log("OTP:", otp);
      console.log(req.cookies);
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

      res.status(200).json({ message: "An otp has been sent to your email" });
    });
  } catch (err) {
    next(err);
  }
});

router.post('/otp', async (req, res) => {
  const { otp } = req.body;

  // Find user in database
  const prevOtp = req.cookies.otp;
  const timestamp = req.cookies.timestamp;
  const email = req.cookies.email;
  console.log(prevOtp, otp)
  // Check if OTP is valid
  if (otp !== prevOtp) {
    console.log("Invalid OTP")
    return res.status(401).json({ message: 'Invalid OTP' });
  }

  // Check if OTP is expired
  const now = Date.now();
  if (now - timestamp > 2 * 60 * 1000) {
    console.log("OTP expired")
    return res.status(401).json({ message: 'OTP expired' });
  }

  const token = jwt.sign({ email: email }, JWT_SECRET, { expiresIn: "1d" });
  res.cookie("token", token, { httpOnly: true });
  // Successful login
  res.status(200).json({ token, message: 'Login successful' });
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

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json("User does not exist");
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
