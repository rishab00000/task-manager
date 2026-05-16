const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

require("dotenv").config({
    path: path.resolve(__dirname, "../.env"),
});

const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const taskRoutes = require("./routes/tasks");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Serve Frontend
const frontendPath = path.join(__dirname, "../frontend/dist");

app.use(express.static(frontendPath));

// React Router Support
app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(frontendPath, "index.html"));
    }
});

// Error Handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});