const express = require("express");
const router = express.Router();
const pool = require("../db");
const authenticateToken = require("../middleware/auth");
const authorize = require("../middleware/authorize");

router.get(
"/summary",
authenticateToken,
authorize("Admin"),
async(req,res)=>{
const result=await pool.query(
`SELECT COUNT(*) AS total_requests
 FROM request_logs`
);
res.json(result.rows[0]);
}
);

router.get(
"/top-consumers",
authenticateToken,
authorize("Admin"),
async(req,res)=>{
const result=await pool.query(
`SELECT
u.name,
COUNT(*) AS requests
FROM request_logs rl
JOIN users u
ON rl.user_id=u.id
GROUP BY u.name
ORDER BY requests DESC`
);
res.json(result.rows);
}
);

router.get(
"/top-endpoints",
authenticateToken,
authorize("Admin"),
async(req,res)=>{
const result=await pool.query(
`SELECT
endpoint,
COUNT(*) AS hits
FROM request_logs
GROUP BY endpoint
ORDER BY hits DESC`
);
res.json(result.rows);
}
);


router.get(
"/recent",
authenticateToken,
authorize("Admin"),
async(req,res)=>{
const result=await pool.query(
`SELECT *
FROM request_logs
ORDER BY created_at DESC
LIMIT 20`
);

res.json(result.rows);
}
);


module.exports = router;