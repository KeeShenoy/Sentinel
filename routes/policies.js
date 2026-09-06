const express = require("express"),
  pool = require("../db"),
  authenticate = require("../middleware/auth"),
  authorize = require("../middleware/authorize"),
  { normalizePolicy, validatePolicy } = require("../services/policy");
const router = express.Router();


const id = (v) =>
  Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null;


router.get("/", authenticate, authorize("Admin"), async (_q, res, next) => {
  try {
    res.json(
      (
        await pool.query(
          "SELECT p.*,a.name AS api_name FROM api_policies p JOIN apis a ON a.id=p.api_id ORDER BY a.id",
        )
      ).rows,
    );
  } catch (e) {
    next(e);
  }
});


router.get("/:apiId", authenticate, async (req, res, next) => {
  try {
    const apiId = id(req.params.apiId);
    if (!apiId) return res.status(400).json({ message: "Invalid API id" });
    const q = await pool.query(
      "SELECT p.*,a.name AS api_name FROM api_policies p JOIN apis a ON a.id=p.api_id WHERE p.api_id=$1",
      [apiId],
    );
    if (!q.rowCount)
      return res.status(404).json({ message: "Policy not found" });
    res.json(q.rows[0]);
  } catch (e) {
    next(e);
  }
});


router.put(
  "/:apiId",
  authenticate,
  authorize("Admin"),
  async (req, res, next) => {
    try {
      const apiId = id(req.params.apiId);
      if (!apiId) return res.status(400).json({ message: "Invalid API id" });
      if (
        !(await pool.query("SELECT 1 FROM apis WHERE id=$1", [apiId])).rowCount
      )
        return res.status(404).json({ message: "API not found" });
      const error = validatePolicy(req.body);
      if (error) return res.status(400).json({ message: error });
      const p = normalizePolicy(req.body);
      const q = await pool.query(
        `INSERT INTO api_policies(api_id,environment,sensitivity,rate_limit,quota_per_day,allowed_methods,timeout_ms,retry_count,circuit_failure_threshold,circuit_cooldown_ms) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(api_id) DO UPDATE SET environment=EXCLUDED.environment,sensitivity=EXCLUDED.sensitivity,rate_limit=EXCLUDED.rate_limit,quota_per_day=EXCLUDED.quota_per_day,allowed_methods=EXCLUDED.allowed_methods,timeout_ms=EXCLUDED.timeout_ms,retry_count=EXCLUDED.retry_count,circuit_failure_threshold=EXCLUDED.circuit_failure_threshold,circuit_cooldown_ms=EXCLUDED.circuit_cooldown_ms,updated_at=CURRENT_TIMESTAMP RETURNING *`,
        [
          apiId,
          p.environment,
          p.sensitivity,
          p.rate_limit,
          p.quota_per_day,
          p.allowed_methods,
          p.timeout_ms,
          p.retry_count,
          p.circuit_failure_threshold,
          p.circuit_cooldown_ms,
        ],
      );
      res.json(q.rows[0]);
    } catch (e) {
      next(e);
    }
  },
);
module.exports = router;
