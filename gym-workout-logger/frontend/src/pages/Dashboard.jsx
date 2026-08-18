import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Loading from "../components/Loading";
import WorkoutStats from "../components/WorkoutStats";
import WorkoutCard from "../components/WorkoutCard";
import { useWorkouts } from "../hooks/useWorkouts";
import { useStats } from "../hooks/useWorkouts";
import { greetingForHour } from "../utils/format";

export default function Dashboard() {
  const navigate = useNavigate();
  const { workouts, loading, error, reload } = useWorkouts();
  const { stats, loading: statsLoading } = useStats();
  const greeter = greetingForHour(new Date().getHours());

  const recent = workouts.slice(0, 5);

  return (
    <div className="page container">
      <section className="hero reveal">
        <span className="hero-greet">{greeter}</span>
        <h1 className="hero-title">Ready to train?</h1>
        <p className="hero-sub">
          Log a session, track your volume, and watch your progress build.
        </p>
        <div className="hero-actions">
          <Button size="lg" onClick={() => navigate("/new")}>
            Start workout
          </Button>
        </div>
      </section>

      <div className="divider" />

      <section>
        <h3 className="section-title">This week</h3>
        <WorkoutStats stats={stats} loading={statsLoading} />
      </section>

      <div className="divider" />

      <section>
        <h3 className="section-title">Recent workouts</h3>
        {loading && <Loading label="Loading workouts…" />}
        {!loading && error && (
          <div className="form-error">
            {error} <button className="btn-link" onClick={reload}>Retry</button>
          </div>
        )}
        {!loading && !error && workouts.length === 0 && (
          <div className="card">
            <div className="empty">
              <h3>No workouts yet</h3>
              <p>Start your first session to see it here.</p>
              <div style={{ marginTop: "1.25rem" }}>
                <Button onClick={() => navigate("/new")}>Start workout</Button>
              </div>
            </div>
          </div>
        )}
        {!loading && !error && workouts.length > 0 && (
          <div className="card">
            {recent.map((w) => (
              <WorkoutCard workout={w} key={w.id} />
            ))}
            {workouts.length > 5 && (
              <div className="workout-row" style={{ textAlign: "center" }}>
                <button
                  className="btn-link"
                  onClick={() => navigate("/history")}
                  style={{ fontWeight: 600, color: "var(--accent-strong)" }}
                >
                  View all {workouts.length} workouts
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
