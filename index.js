const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require('cookie-parser')
const routes = require("./router");

// Set up body parser
app.use(express.json());
app.use(cookieParser());

// Set up static files
app.use(express.static("public"));

// Connect to MongoDB
// I have to change the mongoDB atlas string, and set it to .env file before production 
mongoose.connect("mongodb+srv://ryan:ryan@cluster0.zwg3v3g.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
});

// Set up routes
app.use("/", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
