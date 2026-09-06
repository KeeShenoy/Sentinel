const express = require("express"),
  router = express.Router(),
  pool = require("../db"),
  authenticate = require("../middleware/auth"),
  authorize = require("../middleware/authorize");
const validUrl = (value) => {
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
};
router.get("/", async (_req, res, next) => {
  try {
    res.json(
      (
        await pool.query(
          `SELECT a.*,p.environment,p.sensitivity,p.rate_limit,p.quota_per_day,p.allowed_methods,p.timeout_ms FROM apis a LEFT JOIN api_policies p ON p.api_id=a.id ORDER BY a.id`,
        )
      ).rows,
    );
  } catch (e) {
    next(e);
  }
});
router.post(
  "/register",
  authenticate,
  authorize("Admin"),
  async (req, res, next) => {
    try {
      const { name, description, version, base_path, upstream_url } = req.body;
      if (!name || !version)
        return res
          .status(400)
          .json({ message: "name and version are required" });
      if (upstream_url && !validUrl(upstream_url))
        return res
          .status(400)
          .json({ message: "upstream_url must be an http(s) URL" });
      if (base_path && (!base_path.startsWith("/") || base_path.includes("//")))
        return res.status(400).json({ message: "base_path must start with /" });
      const owner = (
        await pool.query("SELECT name FROM users WHERE id=$1", [req.user.id])
      ).rows[0];
      if (!owner) return res.status(404).json({ message: "Admin not found" });
      const q = await pool.query(
        "INSERT INTO apis(name,description,owner,version,base_path,upstream_url) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
        [
          name,
          description || null,
          owner.name,
          version,
          base_path || null,
          upstream_url || null,
        ],
      );
      await pool.query("INSERT INTO api_policies(api_id) VALUES($1)", [
        q.rows[0].id,
      ]);
      res.status(201).json(q.rows[0]);
    } catch (e) {
      next(e);
    }
  },
);
module.exports = router;
