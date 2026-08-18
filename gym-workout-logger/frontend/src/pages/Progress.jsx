import { useNavigate } from "react-router-dom";
import { useWorkouts } from "../hooks/useWorkouts";
import Loading from "../components/Loading";
import Button from "../components/Button";
import VolumeChart from "../components/VolumeChart";
import { formatLongDate, volumeOfSet, formatDateISO } from "../utils/format";

export default function Progress() {
  const navigate = useNavigate();
  const { workouts, loading, error, reload } = useWorkouts();

  // Compute stats
  const totalWorkouts = workouts.length;
  const today = new Date();
  const startOfWeek = today - new Date(today.getTime() - today.getHours() * 36e5 - today.getMinutes() * 6e4 - today.getSeconds() * 1e3);
  // compute start of week: Monday midnight
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));
  // Actually easier: use month grouping but this_week count from stats. Let me just rely on stats endpoint but I have useWorkouts. 
  // Since stats has this_week count, but useWorkouts doesn't have weekly breakdown. I'll recompute: count sessions where date is within last 7 days.
  const thisWeek = workouts.filter((w) => {
    const wd = new Date(`${w.date}T00:00:00`); // assume user local; in practice we trust backend, but here it's fine.
    const wdMs = wd.getTime();
    const nowMs = today.getTime();
    return wdMs >= nowMs - 7 * 24 * 36e5;
  }).length;

  const totalExercises = workouts.reduce((sum, w) => sum + (w.exercises || []).length, 0);
  const totalSets = workouts.reduce(
    (sum, w) => sum + (w.exercises || []).reduce((s, ex) => s + Number(ex.sets), 0),
    0
  );
  const totalVolume = workouts
    .reduce(
      (sum, w) =>
        sum + (w.exercises || []).reduce(
          (s, ex) => s + volumeOfSet(ex.sets, ex.reps, ex.weight),
          0
        ),
      0
    )
    .toLocaleString();

  // Chart data: volumes per workout, ordered by date (newest first)
  const chartData = workouts
    .map((w) => ({
      value: (w.exercises || []).reduce(
        (s, ex) => s + volumeOfSet(ex.sets, ex.reps, ex.weight),
        0
      ),
      label: formatLongDate(w.date),
    }))
    .filter((d) => d.value > 0);

  if (loading) return <Loading label="Loading progress…" />;

  return (
    <div className="page container" style={{ maxWidth: 760 }}>
      <h1 className="hero-title">Progress</h1>

      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <div className="stat-value accent">{totalWorkouts}</div>
            <div className="stat-label">Workouts</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="stat-value accent">{thisWeek}</div>
            <div className="stat-label">This week</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="stat-value accent">{totalExercises}</div>
            <div className="stat-label">Exercises</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="stat-value accent">{totalSets}</div>
            <div className="stat-label">Sets</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <VolumeChart data={chartData} />
      </div>
    </div>
  );
}