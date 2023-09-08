const express = require('express');
const app = express();
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');

// Set up body parser
app.use(express.json());
app.use(cookieParser());

// Set up static files
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect("mongodb+srv://ryan:12345@cluster0.h2411gj.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

// Set up routes
const router = require('./router');
app.use('/', router);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

// Export the 'app' object
module.exports = app;

// Start the server only if the file is run directly (not imported as a module)
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
}