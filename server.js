require("dotenv").config();
const express = require("express");

const pool = require("./db");
const redisClient = require("./redis");

const rateLimiter = require("./middleware/rateLimiter");


const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/apis");
const accessRoutes = require("./routes/access");


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(rateLimiter);


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

app.use("/users", userRoutes);
app.use("/auth", authRoutes);
app.use("/apis", apiRoutes);
app.use("/access", accessRoutes);



async function startServer() {

    try 
    {
        await pool.query("SELECT NOW()");
        console.log("Database connected!");

        await redisClient.connect();
        console.log("Redis Connected!");

        app.listen(PORT, () => {
        console.log(
            `Server running on http://localhost:${PORT}`
        );
        });
    }

    catch (error) {
        console.error("Failed to start server:");
        console.error(error);
    }

}

startServer();







// app.get("/apis", (req, res) => {

//     const apis = [
//         {
//             id: 1,
//             name: "Payments API",
//             owner: "Finance Team"
//         },
//         {
//             id: 2,
//             name: "Orders API",
//             owner: "Commerce Team"
//         },
//         {
//             id: 3,
//             name: "Analytics API",
//             owner: "Data Team"
//         }
//     ];

//     res.json(apis);

// });



// app.get("/college", (req, res) => {

//     const college = {
//         name: "NMAMIT",
//         location: "Nitte"
//     };

//     res.json(college);

// });


// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

