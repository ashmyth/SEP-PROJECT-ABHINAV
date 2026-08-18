import { api, setStoredAuth, clearStoredAuth } from "./api";

export async function register({ username, email, password, confirm_password }) {
  const data = await api.post(
    "/auth/register/",
    { username, email, password, confirm_password },
    { auth: false }
  );
  setStoredAuth(data.token, data.user);
  return data.user;
}

export async function login({ username, password }) {
  const data = await api.post(
    "/auth/login/",
    { username, password },
    { auth: false }
  );
  setStoredAuth(data.token, data.user);
  return data.user;
}

export async function logout() {
  try {
    await api.post("/auth/logout/");
  } catch {
    // Even if the server call fails, clear local state.
  }
  clearStoredAuth();
}

export async function fetchCurrentUser() {
  const data = await api.get("/auth/user/");
  return data;
}
