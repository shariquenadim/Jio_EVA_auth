const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("./models/user");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Client } = require('@elastic/elasticsearch');
const citiesData = require('./cities.json');
const loadData = require('./loader');
const userController = require("./userController");

const router = express.Router();

// Constants
const JWT_SECRET = "8Zz5tw0Ionm3XPZZfN0NOml3z9FMfmpgXwovR9fp6ryDIoGRM8EPHAB6iHsc0fb";

// CORS configuration
const allowedOrigins = ['http://localhost:4200', 'http://localhost'];
// add the hosting URL also for production

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

// Set up body parser
router.use(express.json());
router.use(cookieParser());

// Sign up route
router.post("/signup", async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    // Password complexity requirements
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(401).json("Password does not meet the complexity requirements");
    }
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

      // Save OTP in server cookie with a 2-minute expiration time
      res.cookie("otp", otp.toString(), { httpOnly: true, maxAge: 2 * 60 * 1000 });

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

      res.status(200).json({ message: "An otp has been sent to your email" });
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
  if (now - req.cookies.otp_time > expirationTime) {
    console.log("OTP expired");
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


// Load data into Elasticsearch
loadData();

// Endpoint for performing full-text search
router.get('/cities/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter.' });
    }

    const client = new Client({ node: 'http://localhost:9200' });
    const indexName = 'smart-cities';

    const body = await client.search({
      index: indexName,
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: q,
                  fields: ["name", "state"],
                  fuzziness: 'AUTO'
                }
              },
              {
                prefix: {
                  name: {
                    value: q.toLowerCase()
                  }
                }
              }
            ]
          }
        }
      }
    });

    console.log('Elasticsearch response:', body);

    if (!body) {
      console.error('Empty response received from Elasticsearch.');
      return res.status(500).json({ error: 'An error occurred while searching for cities.' });
    }

    if (body.error) {
      console.error('Error occurred while searching for cities:', body.error);
      return res.status(500).json({ error: 'An error occurred while searching for cities.' });
    }

    const results = body.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source
    }));

    res.json(results);
  } catch (error) {
    console.error('Error occurred while searching for cities:', error);
    res.status(500).json({ error: 'An error occurred while searching for cities.' });
  }
});


// Endpoint for fetching city details
router.get('/cities/details', (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ error: 'Missing city parameter.' });
    }

    // Replace this with your actual logic to fetch city details
    const cityDetails = citiesData.find((c) => c.name.toLowerCase() === city.toLowerCase());

    if (!cityDetails) {
      return res.status(404).json({ error: 'City details not found.' });
    }

    res.json(cityDetails);
  } catch (error) {
    console.error('Error occurred while fetching city details:', error);
    res.status(500).json({ error: 'An error occurred while fetching city details.' });
  }
});

// Endpoint for submiting review
router.post('/reviews', async (req, res) => {
  try {
    const { userId, cityId, rating } = req.body;

    if (!userId || !cityId || !rating) {
      return res.status(400).json({ error: 'Missing required parameters.' });
    }

    const client = new Client({ node: 'http://localhost:9200' });
    const indexName = 'reviews';

    const body = await client.index({
      index: indexName,
      body: {
        userId,
        cityId,
        rating
      }
    });

    console.log('Review created:', body);

    res.json({ message: 'Review submitted successfully.' });
  } catch (error) {
    console.error('Error occurred while submitting review:', error);
    res.status(500).json({ error: 'An error occurred while submitting the review.' });
  }
});

module.exports = router;
