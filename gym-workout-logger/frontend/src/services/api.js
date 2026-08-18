const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

export const TOKEN_KEY = "gymlog_token";
export const USER_KEY = "gymlog_user";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  clearAuth();
}

function emitUnauthorized() {
  clearAuth();
  window.dispatchEvent(new CustomEvent("auth:unauthorized"));
}

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function friendlyMessage(status, data) {
  if (typeof data === "string" && data) return data;
  if (data && data.detail) return data.detail;
  if (data && data.non_field_errors) return data.non_field_errors[0];
  if (status === 401) return "Your session expired. Please sign in again.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 500) return "Something went wrong on the server. Try again.";
  return "The request could not be completed. Please try again.";
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Token ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "Network error. Check your connection and try again.",
      "network"
    );
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (response.status === 401 && auth) {
    emitUnauthorized();
    throw new ApiError(friendlyMessage(401, data), 401, data);
  }

  if (!response.ok) {
    throw new ApiError(friendlyMessage(response.status, data), response.status, data);
  }

  return data;
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) =>
    request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) =>
    request(path, { ...opts, method: "PATCH", body }),
  put: (path, body, opts) =>
    request(path, { ...opts, method: "PUT", body }),
  delete: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};

export { ApiError };
