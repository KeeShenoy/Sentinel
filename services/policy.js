const DEFAULT_POLICY = {
  environment: "internal",
  sensitivity: "normal",
  rate_limit: 60,
  quota_per_day: 1000,
  allowed_methods: ["GET"],
  timeout_ms: 2000,
  retry_count: 0,
  circuit_failure_threshold: 3,
  circuit_cooldown_ms: 10000,
};
const environments = new Set(["internal", "staging", "production"]),
  sensitivities = new Set(["normal", "sensitive", "restricted"]),
  methods = new Set([
    "GET",
    "HEAD",
    "OPTIONS",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
  ]);
function normalizePolicy(input = {}) {
  const p = { ...DEFAULT_POLICY, ...input };
  p.environment = String(p.environment).toLowerCase();
  p.sensitivity = String(p.sensitivity).toLowerCase();
  p.allowed_methods = (
    Array.isArray(p.allowed_methods) ? p.allowed_methods : []
  ).map((m) => String(m).toUpperCase());
  for (const key of [
    "rate_limit",
    "quota_per_day",
    "timeout_ms",
    "retry_count",
    "circuit_failure_threshold",
    "circuit_cooldown_ms",
  ])
    p[key] = Number(p[key]);
  return p;
}
function validatePolicy(input) {
  const p = normalizePolicy(input);
  if (!environments.has(p.environment))
    return "environment must be internal, staging, or production";
  if (!sensitivities.has(p.sensitivity))
    return "sensitivity must be normal, sensitive, or restricted";
  if (
    !p.allowed_methods.length ||
    p.allowed_methods.some((m) => !methods.has(m))
  )
    return "allowed_methods must contain valid HTTP methods";
  if (
    !Number.isInteger(p.rate_limit) ||
    p.rate_limit < 1 ||
    p.rate_limit > 100000
  )
    return "rate_limit must be a positive integer up to 100000";
  if (!Number.isInteger(p.quota_per_day) || p.quota_per_day < 1)
    return "quota_per_day must be a positive integer";
  if (
    !Number.isInteger(p.timeout_ms) ||
    p.timeout_ms < 100 ||
    p.timeout_ms > 120000
  )
    return "timeout_ms must be between 100 and 120000";
  if (
    !Number.isInteger(p.retry_count) ||
    p.retry_count < 0 ||
    p.retry_count > 3
  )
    return "retry_count must be between 0 and 3";
  if (
    !Number.isInteger(p.circuit_failure_threshold) ||
    p.circuit_failure_threshold < 1 ||
    p.circuit_failure_threshold > 20
  )
    return "circuit_failure_threshold must be between 1 and 20";
  if (
    !Number.isInteger(p.circuit_cooldown_ms) ||
    p.circuit_cooldown_ms < 1000 ||
    p.circuit_cooldown_ms > 600000
  )
    return "circuit_cooldown_ms must be between 1000 and 600000";
  return null;
}
module.exports = { DEFAULT_POLICY, normalizePolicy, validatePolicy };
