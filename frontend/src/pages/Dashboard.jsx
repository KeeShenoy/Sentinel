import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError } from "../api/client";
import Layout from "../components/Layout";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  SuccessBanner,
} from "../components/StatusMessage";

const ADMIN = "Admin";
const CONSUMER = "Consumer";

function ProfileSection({ user }) {
  return (
    <section className="panel">
      <h2>Account</h2>
      <dl className="detail-list">
        <div className="detail-row">
          <dt>Name</dt>
          <dd>{user.name}</dd>
        </div>
        <div className="detail-row">
          <dt>Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="detail-row">
          <dt>Role</dt>
          <dd>{user.role}</dd>
        </div>
        <div className="detail-row">
          <dt>User ID</dt>
          <dd><code>{user.id}</code></dd>
        </div>
      </dl>
    </section>
  );
}

function ApisSection({ apis, user, onRefresh, onSuccess }) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", version: "1.0.0", upstream_url: "", base_path: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isAdmin = user.role === ADMIN;

  async function handleRegister(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await apiRequest("/apis/register", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({ name: "", description: "", version: "1.0.0", upstream_url: "", base_path: "" });
      setRegisterOpen(false);
      onSuccess("API registered successfully.");
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Registered APIs</h2>
        {isAdmin && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setRegisterOpen((v) => !v)}
          >
            {registerOpen ? "Cancel" : "Register API"}
          </button>
        )}
      </div>

      {isAdmin && registerOpen && (
        <form className="inline-form" onSubmit={handleRegister}>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="api-name">Name</label>
              <input
                id="api-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
            <div className="form-field">
              <label htmlFor="api-version">Version</label>
              <input
                id="api-version"
                value={form.version}
                onChange={(e) => setForm({ ...form, version: e.target.value })}
                required
                disabled={submitting}
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="api-desc">Description</label>
            <textarea
              id="api-desc"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              disabled={submitting}
            />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="api-upstream-url">Upstream URL</label>
              <input id="api-upstream-url" type="url" value={form.upstream_url} onChange={(e) => setForm({ ...form, upstream_url: e.target.value })} placeholder="http://demo-api:4000" disabled={submitting} />
            </div>
            <div className="form-field">
              <label htmlFor="api-base-path">Base Path</label>
              <input id="api-base-path" value={form.base_path} onChange={(e) => setForm({ ...form, base_path: e.target.value })} placeholder="Leave empty to forward the requested path" disabled={submitting} />
            </div>
          </div>          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Registering…" : "Submit registration"}
          </button>
        </form>
      )}

      {apis.length === 0 ? (
        <EmptyState
          title="No APIs registered"
          message="Registered APIs will appear here once an admin adds them."
        />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Version</th>
                <th>Owner</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {apis.map((api) => (
                <tr key={api.id}>
                  <td><strong>{api.name}</strong></td>
                  <td><code>{api.version}</code></td>
                  <td>{api.owner}</td>
                  <td className="cell-muted">{api.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AnalyticsSection({ analytics }) {
  const { summary, topConsumers, topEndpoints, recent } = analytics;

  return (
    <section className="panel">
      <h2>Platform Analytics</h2>
      <p className="panel-desc">Request observability across governed APIs.</p>

      <div className="metric-grid">
        <div className="metric-card">
          <span className="metric-label">Total requests</span>
          <span className="metric-value">
            {summary?.total_requests ?? "—"}
          </span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-block">
          <h3>Top consumers</h3>
          {topConsumers.length === 0 ? (
            <EmptyState title="No consumer data" message="Request logs will populate this table." />
          ) : (
            <div className="table-wrap">
              <table className="data-table data-table-compact">
                <thead>
                  <tr>
                    <th>Consumer</th>
                    <th>Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {topConsumers.map((row, i) => (
                    <tr key={i}>
                      <td>{row.name}</td>
                      <td>{row.requests}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="analytics-block">
          <h3>Top endpoints</h3>
          {topEndpoints.length === 0 ? (
            <EmptyState title="No endpoint data" message="Traffic will appear as requests are logged." />
          ) : (
            <div className="table-wrap">
              <table className="data-table data-table-compact">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Hits</th>
                  </tr>
                </thead>
                <tbody>
                  {topEndpoints.map((row, i) => (
                    <tr key={i}>
                      <td><code>{row.endpoint}</code></td>
                      <td>{row.hits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="analytics-block">
        <h3>Recent requests</h3>
        {recent.length === 0 ? (
          <EmptyState title="No recent requests" />
        ) : (
          <div className="table-wrap">
            <table className="data-table data-table-compact">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id}>
                    <td><code>{row.method}</code></td>
                    <td><code>{row.endpoint}</code></td>
                    <td>
                      <span className={`status-code status-${Math.floor(row.status_code / 100)}xx`}>
                        {row.status_code}
                      </span>
                    </td>
                    <td className="cell-muted">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function ConsumerAccessSection({ apis, onSuccess }) {
  const [selectedApi, setSelectedApi] = useState("");
  const [reason, setReason] = useState("");
  const [keys, setKeys] = useState([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [keysError, setKeysError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");

  const loadKeys = useCallback(async (showLoading = true) => {
    if (showLoading) setKeysLoading(true);
    setKeysError("");
    try {
      const data = await apiRequest("/access/my-keys");
      setKeys(data);
    } catch (err) {
      setKeysError(err.message);
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setKeysError("");
      try {
        const data = await apiRequest("/access/my-keys");
        if (!cancelled) setKeys(data);
      } catch (err) {
        if (!cancelled) setKeysError(err.message);
      } finally {
        if (!cancelled) setKeysLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRequest(event) {
    event.preventDefault();
    setRequestError("");
    setSubmitting(true);

    try {
      const result = await apiRequest("/access/request", {
        method: "POST",
        body: JSON.stringify({
          api_id: Number(selectedApi),
          reason,
        }),
      });
      setReason("");
      setSelectedApi("");
      if (result.decision === "ALLOW" ) {
        await loadKeys(false);
      }
      onSuccess(result.decision === "ALLOW" ? "Access granted automatically. Your API key is available below." : "Access request submitted for administrator review.");
    } catch (err) {
      setRequestError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="panel">
        <h2>Request API Access</h2>
        <p className="panel-desc">
          Normal governed APIs may be granted automatically by policy. Sensitive or restricted APIs are sent for administrator review.
        </p>

        <form className="inline-form" onSubmit={handleRequest}>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="access-api">API</label>
              <select
                id="access-api"
                value={selectedApi}
                onChange={(e) => setSelectedApi(e.target.value)}
                required
                disabled={submitting || apis.length === 0}
              >
                <option value="">Select an API…</option>
                {apis.map((api) => (
                  <option key={api.id} value={api.id}>
                    {api.name} (v{api.version})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="access-reason">Reason</label>
            <textarea
              id="access-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe your intended use…"
              required
              disabled={submitting}
            />
          </div>
          {requestError && <p className="form-error">{requestError}</p>}
          <button type="submit" className="btn btn-primary" disabled={submitting || apis.length === 0}>
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>My API Keys</h2>
          <button type="button" className="btn btn-ghost" onClick={() => loadKeys(true)}>
            Refresh
          </button>
        </div>

        {keysLoading ? (
          <LoadingState label="Loading keys…" />
        ) : keysError ? (
          <ErrorState message={keysError} onRetry={loadKeys} />
        ) : keys.length === 0 ? (
          <EmptyState
            title="No API keys yet"
            message="Approved access requests will appear here with issued keys."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>API</th>
                  <th>Key</th>
                  <th>Issued</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((row, i) => (
                  <tr key={i}>
                    <td>{row.api_name}</td>
                    <td><code className="key-value">{row.api_key}</code></td>
                    <td className="cell-muted">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function AdminAccessSection({ onSuccess }) {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState(null);

  const loadPending = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const data = await apiRequest("/access/pending");
      setPending(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setError("");
      try {
        const data = await apiRequest("/access/pending");
        if (!cancelled) setPending(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleApprove(id) {
    setApprovingId(id);
    try {
      const result = await apiRequest(`/access/approve/${id}`, { method: "POST" });
      onSuccess(`Access approved. Key issued: ${result.apiKey}`);
      loadPending(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Pending Access Requests</h2>
        <button type="button" className="btn btn-ghost" onClick={() => loadPending(true)}>
          Refresh
        </button>
      </div>
      <p className="panel-desc">Review and approve consumer requests for governed APIs.</p>

      {loading ? (
        <LoadingState label="Loading requests…" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPending} />
      ) : pending.length === 0 ? (
        <EmptyState title="No pending requests" message="All access requests have been processed." />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Consumer</th>
                <th>API</th>
                <th>Reason</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pending.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.api_name}</td>
                  <td className="cell-muted">{row.reason}</td>
                  <td><span className="badge badge-pending">{row.status}</span></td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={approvingId === row.id}
                      onClick={() => handleApprove(row.id)}
                    >
                      {approvingId === row.id ? "Approving…" : "Approve"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Dashboard({ onSessionExpired }) {
  const [user, setUser] = useState(null);
  const [apis, setApis] = useState([]);
  const [analytics, setAnalytics] = useState({
    summary: null,
    topConsumers: [],
    topEndpoints: [],
    recent: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [successMessage, setSuccessMessage] = useState("");

  const loadApis = useCallback(async () => {
    const apiData = await apiRequest("/apis");
    setApis(apiData);
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const profile = await apiRequest("/users/profile");
      setUser(profile.user);

      await loadApis();

      if (profile.user.role === ADMIN) {
        const [summary, topConsumers, topEndpoints, recent] = await Promise.all([
          apiRequest("/analytics/summary"),
          apiRequest("/analytics/top-consumers"),
          apiRequest("/analytics/top-endpoints"),
          apiRequest("/analytics/recent"),
        ]);

        setAnalytics({ summary, topConsumers, topEndpoints, recent });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onSessionExpired?.();
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [loadApis, onSessionExpired]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const profile = await apiRequest("/users/profile");
        if (cancelled) return;

        setUser(profile.user);

        const apiData = await apiRequest("/apis");
        if (cancelled) return;
        setApis(apiData);

        if (profile.user.role === ADMIN) {
          const [summary, topConsumers, topEndpoints, recent] = await Promise.all([
            apiRequest("/analytics/summary"),
            apiRequest("/analytics/top-consumers"),
            apiRequest("/analytics/top-endpoints"),
            apiRequest("/analytics/recent"),
          ]);

          if (cancelled) return;
          setAnalytics({ summary, topConsumers, topEndpoints, recent });
        }
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError && err.status === 401) {
          onSessionExpired?.();
          return;
        }
        setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [onSessionExpired]);

  const tabs = useMemo(() => {
    const base = [
      { id: "overview", label: "Overview" },
      { id: "apis", label: "APIs" },
      { id: "access", label: "Access Control" },
    ];

    if (user?.role === ADMIN) {
      base.splice(2, 0, { id: "analytics", label: "Analytics" });
    }

    return base;
  }, [user?.role]);

  function handleSuccess(message) {
    setSuccessMessage(message);
  }

  if (loading) {
    return (
      <div className="login-page">
        <LoadingState label="Loading dashboard…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ maxWidth: 480 }}>
          <ErrorState
            title="Dashboard unavailable"
            message={error}
            onRetry={loadDashboard}
          />
        </div>
      </div>
    );
  }

  return (
    <Layout
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={tabs}
    >
      <SuccessBanner
        message={successMessage}
        onDismiss={() => setSuccessMessage("")}
      />

      {activeTab === "overview" && user && <ProfileSection user={user} />}

      {activeTab === "apis" && user && (
        <ApisSection
          apis={apis}
          user={user}
          onRefresh={loadApis}
          onSuccess={handleSuccess}
        />
      )}

      {activeTab === "analytics" && user?.role === ADMIN && (
        <AnalyticsSection analytics={analytics} />
      )}

      {activeTab === "access" && user?.role === CONSUMER && (
        <ConsumerAccessSection apis={apis} onSuccess={handleSuccess} />
      )}

      {activeTab === "access" && user?.role === ADMIN && (
        <AdminAccessSection onSuccess={handleSuccess} />
      )}
    </Layout>
  );
}

export default Dashboard;



