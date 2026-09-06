# Sentinel

Sentinel is a learning-scale **Policy-Driven API Governance & Resilience Platform**. I wanted to turn system-design concepts into a working project: when many teams produce and consume APIs, access, policies, traffic control, failures, and observability become system-level concerns.

## Architecture

The control plane (Express backend and React console) manages the API catalog, policies, access workflow, governance data, and analytics. The data plane is a lightweight gateway: `Consumer -> Gateway -> Upstream API`.

PostgreSQL holds catalog/policy/audit data. Redis holds shared per-consumer/per-API rate and daily-quota counters. Circuit breaker state is deliberately in-memory per gateway/API; it is a documented learning-scale trade-off, unlike the distributed Redis counters.

Sentinel is not a replacement for AWS API Gateway, Azure API Management, or Kong, and does not claim production readiness.

## Run

```powershell
docker compose up --build
cd frontend; npm run dev
```

The backend runs repeatable, non-destructive migrations on startup. Register an API with an upstream such as `http://demo-api:4000`. `base_path` is an optional upstream path prefix: with `/demo`, call `/gateway/<apiId>/healthy` and Sentinel forwards to `/demo/healthy`; when it is empty, `/gateway/<apiId>/demo/healthy` forwards unchanged. Then configure its policy through Admin-only `PUT /policies/:apiId`.

## Runtime demonstration

Use a consumer credential in `X-API-Key`:

```powershell
curl.exe -H "X-API-Key: <key>" http://localhost:4001/gateway/<apiId>/healthy
curl.exe -H "X-API-Key: <key>" http://localhost:4002/gateway/<apiId>/healthy
```

A policy rate limit of five makes the sixth call across either port return `429`, demonstrating shared Redis state. `/demo/slow` returns `504` when timeout is below five seconds. Repeated `/demo/fail` responses open the API-scoped breaker (`503`); after cooldown, a successful `/demo/healthy` half-open probe closes it. Retries are only for GET, HEAD, and OPTIONS—state-changing methods are never retried automatically.

## Trade-offs

Sentinel uses a modular control plane plus one small gateway service rather than microservices, Kubernetes, a service mesh, or an external identity provider. API-key handling is deliberately retained from the original project.
Gateway traffic is a JSON API demonstration. It preserves query strings and content type, but does not support arbitrary multipart or binary proxying.
