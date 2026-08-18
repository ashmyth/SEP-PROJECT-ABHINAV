import { useNavigate } from "react-router-dom";
import { formatLongDate, volumeOfSet } from "../utils/format";

export function workoutSummary(workout) {
  const exercises = workout.exercises || [];
  const exerciseCount = exercises.length;
  const totalSets = exercises.reduce(
    (sum, e) => sum + (Number(e.sets) || 0),
    0
  );
  const volume = exercises.reduce(
    (sum, e) => sum + volumeOfSet(e.sets, e.reps, e.weight),
    0
  );
  return { exerciseCount, totalSets, volume };
}

export default function WorkoutCard({ workout }) {
  const navigate = useNavigate();
  const { exerciseCount, totalSets } = workoutSummary(workout);
  const exercises = workout.exercises || [];

  const go = () => navigate(`/workout/${workout.id}`);

  return (
    <div
      className="workout-row"
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
    >
      <div className="workout-row-head">
        <span className="workout-date">{formatLongDate(workout.date)}</span>
        <span className="workout-meta">
          {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"} ·{" "}
          {totalSets} sets
        </span>
      </div>
      <div className="workout-detail-line">
        {exercises.slice(0, 4).map((ex) => (
          <span className="chip" key={ex.id}>
            {ex.name}
          </span>
        ))}
        {exercises.length > 4 && (
          <span className="chip">+{exercises.length - 4} more</span>
        )}
      </div>
    </div>
  );
}
