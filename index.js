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

mongoose.connect("mongodb+srv://ryan:ryan@cluster0.zwg3v3g.mongodb.net/?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("error", console.error.bind(console, "MongoDB connection error:"));
mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
});

// Set up routes
app.use("/", routes);

// Set up error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
