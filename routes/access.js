const express = require("express"),
  pool = require("../db"),
  keygen = require("../utils/apiKeyGenerator"),
  authenticate = require("../middleware/auth"),
  authorize = require("../middleware/authorize");
const router = express.Router();
function decideAccess(api, existing) {
  if (!api)
    return { decision: "DENY", reason: "The requested API does not exist." };
  if (existing)
    return {
      decision: "ALLOW",
      reason: "Existing access is still active.",
      existing: true,
    };
  if (["sensitive", "restricted"].includes(api.sensitivity))
    return {
      decision: "REVIEW",
      reason: "This API's sensitivity requires administrator review.",
    };
  return {
    decision: "ALLOW",
    reason: "Normal governed APIs are granted automatically by policy.",
  };
}
router.post(
  "/request",
  authenticate,
  authorize("Consumer"),
  async (req, res, next) => {
    try {
      const apiId = Number(req.body.api_id);
      if (!Number.isInteger(apiId) || apiId < 1)
        return res.status(400).json({ message: "Valid api_id is required" });
      const api = (
        await pool.query(
          "SELECT a.*,p.sensitivity FROM apis a JOIN api_policies p ON p.api_id=a.id WHERE a.id=$1",
          [apiId],
        )
      ).rows[0];
      const existing = api
        ? (
            await pool.query(
              "SELECT api_key FROM api_keys WHERE user_id=$1 AND api_id=$2 ORDER BY id DESC LIMIT 1",
              [req.user.id, apiId],
            )
          ).rows[0]
        : null;
      const outcome = decideAccess(api, existing);
      if (outcome.decision === "DENY")
        return res
          .status(404)
          .json({ message: outcome.reason, decision: outcome.decision });
      if (outcome.existing)
        return res.json({
          message: outcome.reason,
          decision: outcome.decision,
          apiKey: existing.api_key,
        });
      if (outcome.decision === "REVIEW") {
        const q = await pool.query(
          "INSERT INTO access_requests(user_id,api_id,reason,status) VALUES($1,$2,$3,'Pending') RETURNING *",
          [req.user.id, apiId, req.body.reason || null],
        );
        return res
          .status(202)
          .json({
            message: outcome.reason,
            decision: outcome.decision,
            request: q.rows[0],
          });
      }
      const apiKey = keygen();
      await pool.query(
        "INSERT INTO api_keys(api_key,user_id,api_id) VALUES($1,$2,$3)",
        [apiKey, req.user.id, apiId],
      );
      res
        .status(201)
        .json({ message: outcome.reason, decision: outcome.decision, apiKey });
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/pending",
  authenticate,
  authorize("Admin"),
  async (_req, res, next) => {
    try {
      res.json(
        (
          await pool.query(
            `SELECT ar.id,u.name,a.name AS api_name,ar.reason,ar.status,ar.requested_at FROM access_requests ar JOIN users u ON u.id=ar.user_id JOIN apis a ON a.id=ar.api_id WHERE ar.status='Pending' ORDER BY ar.id`,
          )
        ).rows,
      );
    } catch (e) {
      next(e);
    }
  },
);
router.post(
  "/approve/:id",
  authenticate,
  authorize("Admin"),
  async (req, res, next) => {
    try {
      const request = (
        await pool.query("SELECT * FROM access_requests WHERE id=$1", [
          req.params.id,
        ])
      ).rows[0];
      if (!request)
        return res.status(404).json({ message: "Access request not found" });
      if (request.status === "Approved")
        return res.status(400).json({ message: "Request already approved" });
      const existing = await pool.query(
        "SELECT api_key FROM api_keys WHERE user_id=$1 AND api_id=$2 LIMIT 1",
        [request.user_id, request.api_id],
      );
      const apiKey = existing.rowCount ? existing.rows[0].api_key : keygen();
      if (!existing.rowCount)
        await pool.query(
          "INSERT INTO api_keys(api_key,user_id,api_id) VALUES($1,$2,$3)",
          [apiKey, request.user_id, request.api_id],
        );
      await pool.query(
        "UPDATE access_requests SET status='Approved' WHERE id=$1",
        [request.id],
      );
      res.json({ message: "Access approved", apiKey });
    } catch (e) {
      next(e);
    }
  },
);
router.get(
  "/my-keys",
  authenticate,
  authorize("Consumer"),
  async (req, res, next) => {
    try {
      res.json(
        (
          await pool.query(
            "SELECT ak.api_key,a.name AS api_name,a.base_path,ak.created_at FROM api_keys ak JOIN apis a ON a.id=ak.api_id WHERE ak.user_id=$1 ORDER BY ak.id",
            [req.user.id],
          )
        ).rows,
      );
    } catch (e) {
      next(e);
    }
  },
);
module.exports = router;
module.exports.decideAccess = decideAccess;
