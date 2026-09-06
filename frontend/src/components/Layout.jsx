import { logout } from "../api/client";

function RoleBadge({ role }) {
  const className =
    role === "Admin" ? "badge badge-admin" : "badge badge-consumer";

  return <span className={className}>{role}</span>;
}

export default function Layout({ user, activeTab, onTabChange, tabs, children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <h1 className="brand-title">Sentinel</h1>
          <p className="brand-subtitle">Policy-Driven API Governance</p>
        </div>

        {user && (
          <div className="header-user">
            <div className="user-meta">
              <span className="user-name">{user.name}</span>
              <RoleBadge role={user.role} />
            </div>
            <button type="button" className="btn btn-ghost" onClick={logout}>
              Logout
            </button>
          </div>
        )}
      </header>

      <nav className="app-nav" aria-label="Dashboard sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`nav-tab${activeTab === tab.id ? " nav-tab-active" : ""}`}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="app-main">{children}</main>
    </div>
  );
}
