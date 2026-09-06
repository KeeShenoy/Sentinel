export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="status-block" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="status-block status-error" role="alert">
      <strong>{title}</strong>
      {message && <p>{message}</p>}
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, message }) {
  return (
    <div className="status-block status-empty">
      <strong>{title}</strong>
      {message && <p>{message}</p>}
    </div>
  );
}

export function SuccessBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="banner banner-success" role="status">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className="banner-dismiss" onClick={onDismiss} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
