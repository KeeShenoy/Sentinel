-- Initial Sentinel governance schema for new databases.
ALTER TABLE apis ADD COLUMN IF NOT EXISTS base_path varchar(120);
ALTER TABLE apis ADD COLUMN IF NOT EXISTS upstream_url varchar(500);
CREATE TABLE IF NOT EXISTS api_policies (
 id serial PRIMARY KEY, api_id integer NOT NULL UNIQUE REFERENCES apis(id) ON DELETE CASCADE,
 environment varchar(20) NOT NULL DEFAULT 'internal', sensitivity varchar(20) NOT NULL DEFAULT 'normal', rate_limit integer NOT NULL DEFAULT 60, quota_per_day integer NOT NULL DEFAULT 1000,
 allowed_methods varchar(20)[] NOT NULL DEFAULT ARRAY['GET'], timeout_ms integer NOT NULL DEFAULT 2000, retry_count integer NOT NULL DEFAULT 0, circuit_failure_threshold integer NOT NULL DEFAULT 3, circuit_cooldown_ms integer NOT NULL DEFAULT 10000,
 created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK (environment IN ('internal','staging','production')), CHECK (sensitivity IN ('normal','sensitive','restricted')), CHECK(rate_limit>0), CHECK(quota_per_day>0), CHECK(timeout_ms>0), CHECK(retry_count>=0), CHECK(circuit_failure_threshold>0), CHECK(circuit_cooldown_ms>0)
);
INSERT INTO api_policies(api_id) SELECT id FROM apis ON CONFLICT(api_id) DO NOTHING;
ALTER TABLE request_logs ADD COLUMN IF NOT EXISTS traffic_plane varchar(20) NOT NULL DEFAULT 'control';
ALTER TABLE request_logs ADD COLUMN IF NOT EXISTS runtime_result varchar(40);
ALTER TABLE request_logs ADD COLUMN IF NOT EXISTS latency_ms integer;
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_request_logs_api_created ON request_logs(api_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_user_created ON request_logs(user_id,created_at DESC);
