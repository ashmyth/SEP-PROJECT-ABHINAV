import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setBusy(true);
    try {
      await login({ username: username.trim(), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <h1 className="auth-title">Welcome back</h1>
      <p className="auth-sub">Sign in to view and log your training.</p>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label className="field">
            <span style={{ marginBottom: "0.35rem", fontWeight: 600 }}>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="your username"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="field">
            <span style={{ marginBottom: "0.35rem", fontWeight: 600 }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </label>
        </div>

        <Button type="submit" block size="lg" disabled={busy}>
          {busy ? "Signing in…" : "Log in"}
        </Button>
      </form>

      <p className="auth-foot">
        Don't have an account? <Link to="/register">Create account</Link>
      </p>
    </div>
  );
}
