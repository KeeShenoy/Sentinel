const API_BASE_URL = "http://localhost:3000";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token");

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError("Unable to reach the server. Is the backend running?", 0);
  }

  let data = null;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  }

  if (!response.ok) {
    const message =
      data?.message || data?.error || `Request failed (${response.status})`;

    if (response.status === 401) {
      localStorage.removeItem("token");
    }

    throw new ApiError(message, response.status);
  }

  return data;
}

export function logout() {
  localStorage.removeItem("token");
  window.location.reload();
}
