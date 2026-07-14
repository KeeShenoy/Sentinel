require("dotenv").config();

const pool = require("./db");

const express = require("express");

const app = express();

app.use(express.json());

const PORT = 3000;

app.get("/health", (req, res) => {

    console.log("Health endpoint was called.");

    res.json({
        success: true,
        status: "healthy",
        project: "TrustMesh Lite",
        version: "1.0.0",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });

});

app.get("/apis", (req, res) => {

    const apis = [
        {
            id: 1,
            name: "Payments API",
            owner: "Finance Team"
        },
        {
            id: 2,
            name: "Orders API",
            owner: "Commerce Team"
        },
        {
            id: 3,
            name: "Analytics API",
            owner: "Data Team"
        }
    ];

    res.json(apis);

});

const userRoutes = require("./routes/users");
app.use("/users", userRoutes);

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

app.get("/college", (req, res) => {

    const college = {
        name: "NMAMIT",
        location: "Nitte"
    };

    res.json(college);

});

pool.query("SELECT NOW()", (err, result) => {

    if (err) {
        console.error("Database connection failed.");
    } else {
        console.log("Database connected!");
        console.log(result.rows[0]);
    }

});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});