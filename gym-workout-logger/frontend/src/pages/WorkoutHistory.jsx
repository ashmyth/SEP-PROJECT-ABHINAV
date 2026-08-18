import { useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import WorkoutCard from "../components/WorkoutCard";
import { useWorkouts } from "../hooks/useWorkouts";
import { formatLongDate } from "../utils/format";

function groupByMonth(workouts) {
  const groups = {};
  for (const w of workouts) {
    const d = new Date(`${w.date}T00:00:00`);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!groups[key]) {
      groups[key] = {
        label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        items: [],
      };
    }
    groups[key].items.push(w);
  }
  return Object.values(groups);
}

export default function WorkoutHistory() {
  const navigate = useNavigate();
  const { workouts, loading, error, reload } = useWorkouts();

  return (
    <div className="page container" style={{ maxWidth: 760 }}>
      <h1 className="hero-title" style={{ fontSize: "2.2rem" }}>
        Workout history
      </h1>
      <p className="hero-sub">Every session you've logged, newest first.</p>

      <div style={{ marginTop: "1.75rem" }}>
        {loading && <Loading label="Loading history…" />}
        {!loading && error && (
          <div className="form-error">
            {error} <button className="btn-link" onClick={reload}>Retry</button>
          </div>
        )}
        {!loading && !error && workouts.length === 0 && (
          <div className="card">
            <div className="empty">
              <h3>No workouts yet</h3>
              <p>Your logged sessions will appear here.</p>
            </div>
          </div>
        )}
        {!loading &&
          !error &&
          workouts.length > 0 &&
          groupByMonth(workouts).map((group) => (
            <div key={group.label} style={{ marginBottom: "1.75rem" }}>
              <h3 className="section-title">{group.label}</h3>
              <div className="card">
                {group.items.map((w) => (
                  <WorkoutCard workout={w} key={w.id} />
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
