const express = require("express");
const cors = require('cors');
const cookieParser = require('cookie-parser');
const loadData = require('../Jio_EVA_auth/elastic loading delete data/loader');
const userController = require("../Jio_EVA_auth/Controllers/userController");
const cityController = require('../Jio_EVA_auth/Controllers/cityController');
const emailController = require('../Jio_EVA_auth/Controllers/emailController');

const router = express.Router();


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
router.post("/signup", userController.signup);

// Login route
router.post("/login", userController.login);

// Logout route
router.post("/logout", userController.logout);

// Get current user route
router.get("/me", userController.getCurrentUser);

// Verify email route
router.get("/verify-email", emailController.verifyEmail);

// OTP verification route
router.post('/otp', emailController.verifyOTP);

// forget password route
router.post('/forget-password', userController.forgetPassword);

// reset password route
router.post('/reset-password', userController.resetPassword);

// Load data into Elasticsearch
loadData();

// Endpoint for performing full-text search
router.get('/cities/search', cityController.searchCities);

// Endpoint for fetching city details
router.get('/cities/details', cityController.getCityDetails);

// Endpoint for submitting a review
router.post('/reviews', cityController.submitReview);

// Endpoint for getting city reviews and avg ratings
router.get('/cities/reviews', cityController.getCityReviews);


module.exports = router;
