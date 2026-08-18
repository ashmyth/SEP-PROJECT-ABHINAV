import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.username.trim()) {
      setError("Please choose a username.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <h1 className="auth-title">Create account</h1>
      <p className="auth-sub">Start tracking your workouts in seconds.</p>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={submit} noValidate>
        <div className="form-group">
          <label className="field">
            <span style={{ marginBottom: "0.35rem", fontWeight: 600 }}>Username</span>
            <input
              value={form.username}
              onChange={set("username")}
              autoComplete="username"
              placeholder="choose a username"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="field">
            <span style={{ marginBottom: "0.35rem", fontWeight: 600 }}>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="field">
            <span style={{ marginBottom: "0.35rem", fontWeight: 600 }}>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              autoComplete="new-password"
              placeholder="at least 8 characters"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="field">
            <span style={{ marginBottom: "0.35rem", fontWeight: 600 }}>
              Confirm Password
            </span>
            <input
              type="password"
              value={form.confirm_password}
              onChange={set("confirm_password")}
              autoComplete="new-password"
              placeholder="re-enter password"
            />
          </label>
        </div>

        <Button type="submit" block size="lg" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="auth-foot">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
