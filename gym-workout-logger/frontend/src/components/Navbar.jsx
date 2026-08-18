import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const initial = (user?.username || "?").charAt(0).toUpperCase();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">GL</span>
          <span>Gym Log</span>
        </NavLink>

        <nav className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Workouts
          </NavLink>
          <NavLink
            to="/progress"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Progress
          </NavLink>

          <div className="nav-user">
            <span className="avatar" title={user?.username}>
              {initial}
            </span>
            <span className="username-text" style={{ fontWeight: 600 }}>
              {user?.username}
            </span>
            <button className="btn-link" onClick={logout}>
              Log out
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
