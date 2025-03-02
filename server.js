const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./database"); // Import the database connection
const employeeRoutes = require("./routes"); // Import the routes

const app = express(); // ✅ Initialize app here, before using it

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/", employeeRoutes); // ✅ Now app is initialized before using it

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});