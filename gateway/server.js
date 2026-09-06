require("dotenv").config();
const express = require("express"),
  pool = require("../db"),
  redis = require("../redis"),
  breaker = require("./circuitBreaker");
const app = express();
app.use(express.json({ limit: "100kb" }));
const safe = new Set(["GET", "HEAD", "OPTIONS"]);
const day = () => new Date().toISOString().slice(0, 10);
const incrementScript =
  "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n";
async function increment(key, seconds) {
  return redis.eval(incrementScript, {
    keys: [String(key)],
    arguments: [String(seconds)],
  });
}
async function audit(userId, apiId, req, status, result, start) {
  try {
    await pool.query(
      "INSERT INTO request_logs(user_id,api_id,endpoint,method,status_code,traffic_plane,runtime_result,latency_ms) VALUES($1,$2,$3,$4,$5,'gateway',$6,$7)",
      [
        userId || null,
        apiId || null,
        req.originalUrl,
        req.method,
        status,
        result,
        Date.now() - start,
      ],
    );
  } catch (error) {
    console.error("Gateway audit write failed", error.message);
  }
}
function splatPath(splat) {
  const parts = Array.isArray(splat) ? splat : [splat];
  return (
    "/" +
    parts
      .filter(Boolean)
      .map((part) =>
        encodeURIComponent(decodeURIComponent(part)).replace(/%2F/gi, "/"),
      )
      .join("/")
  );
}
function upstreamPath(basePath, splat) {
  const prefix =
    basePath && basePath !== "/" ? basePath.replace(/\/$/, "") : "";
  return `${prefix}${splatPath(splat)}`;
}
app.get("/health", async (_req, res) => {
  let redisStatus = "unavailable",
    databaseStatus = "unavailable";
  try {
    await redis.ping();
    redisStatus = "connected";
  } catch {}
  try {
    await pool.query("SELECT 1");
    databaseStatus = "connected";
  } catch {}
  res
    .status(
      redisStatus === "connected" && databaseStatus === "connected" ? 200 : 503,
    )
    .json({
      status: "healthy",
      redis: redisStatus,
      database: databaseStatus,
      uptime: process.uptime(),
    });
});
app.all("/gateway/:apiId/*splat", async (req, res) => {
  const start = Date.now(),
    requestedApiId = Number(req.params.apiId);
  let identity;
  const fail = async (status, message, result) => {
    await audit(
      identity?.user_id,
      identity?.api_id || requestedApiId,
      req,
      status,
      result,
      start,
    );
    return res.status(status).json({ message });
  };
  try {
    const apiKey = req.get("x-api-key");
    if (!apiKey) return fail(401, "Missing x-api-key", "missing_credential");
    if (!Number.isInteger(requestedApiId) || requestedApiId < 1)
      return fail(400, "Invalid API id", "invalid_api");
    identity = (
      await pool.query(
        `SELECT ak.user_id,ak.api_id,a.upstream_url,a.base_path,p.* FROM api_keys ak JOIN apis a ON a.id=ak.api_id JOIN api_policies p ON p.api_id=a.id WHERE ak.api_key=$1 AND ak.api_id=$2`,
        [apiKey, requestedApiId],
      )
    ).rows[0];
    if (!identity)
      return fail(403, "Invalid API credential", "invalid_credential");
    if (!identity.upstream_url)
      return fail(503, "API has no upstream configured", "missing_upstream");
    if (!identity.allowed_methods.includes(req.method))
      return fail(405, "Method not allowed by policy", "method_denied");
    if (
      (await increment(
        `gateway:rate:${identity.user_id}:${identity.api_id}`,
        60,
      )) > identity.rate_limit
    )
      return fail(429, "Rate limit exceeded", "rate_limited");
    if (
      (await increment(
        `gateway:quota:${identity.user_id}:${identity.api_id}:${day()}`,
        86400,
      )) > identity.quota_per_day
    )
      return fail(429, "Daily quota exceeded", "quota_exceeded");
    const gate = breaker.before(identity.api_id, identity.circuit_cooldown_ms);
    if (gate.blocked)
      return fail(503, "Upstream circuit is open", "circuit_open");
    const url = new URL(
      upstreamPath(identity.base_path, req.params.splat),
      identity.upstream_url,
    );
    url.search = new URL(req.originalUrl, "http://gateway.local").search;
    let attempt = 0,
      response;
    while (true) {
      try {
        response = await fetch(url, {
          method: req.method,
          headers: req.get("content-type")
            ? { "content-type": req.get("content-type") }
            : undefined,
          body: safe.has(req.method) ? undefined : JSON.stringify(req.body),
          signal: AbortSignal.timeout(identity.timeout_ms),
        });
        if (response.status >= 500) throw new Error("upstream failure");
        break;
      } catch (error) {
        if (++attempt > identity.retry_count || !safe.has(req.method)) {
          breaker.failure(identity.api_id, identity.circuit_failure_threshold);
          return fail(
            error.name === "TimeoutError" ? 504 : 502,
            "Upstream request failed",
            error.name === "TimeoutError" ? "timeout" : "upstream_failure",
          );
        }
      }
    }
    breaker.success(identity.api_id);
    const body = await response.text();
    await audit(
      identity.user_id,
      identity.api_id,
      req,
      response.status,
      "success",
      start,
    );
    res
      .status(response.status)
      .type(response.headers.get("content-type") || "application/json")
      .send(body);
  } catch (error) {
    console.error("Gateway error", error.message);
    return fail(500, "Gateway error", "gateway_error");
  }
});
async function start() {
  await pool.query("SELECT 1");
  if (!redis.isOpen) await redis.connect();
  app.listen(process.env.GATEWAY_PORT || 4001, () =>
    console.log("Sentinel gateway listening"),
  );
}
start();
