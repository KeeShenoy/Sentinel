require("dotenv").config();
const express = require("express"),
  cors = require("cors"),
  pool = require("./db"),
  redis = require("./redis"),
  runMigrations = require("./migrations/run");
const app = express();
app.use(cors());
app.use(express.json());
app.use(require("./middleware/rateLimiter"));
app.use(require("./middleware/logger"));
app.get("/health", async (_req, res) =>
  res.json({
    success: true,
    status: "healthy",
    project: "Sentinel",
    version: "2.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  }),
);
app.use("/auth", require("./routes/auth"));
app.use("/users", require("./routes/users"));
app.use("/apis", require("./routes/apis"));
app.use("/access", require("./routes/access"));
app.use("/analytics", require("./routes/analytics"));
app.use("/policies", require("./routes/policies"));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error" });
});
async function start() {
  try {
    await pool.query("SELECT NOW()");
    await runMigrations();
    if (!redis.isOpen) await redis.connect();
    app.listen(process.env.PORT || 3000, () =>
      console.log("Sentinel control plane listening"),
    );
  } catch (e) {
    console.error("Failed to start server:", e);
  }
}
start();
