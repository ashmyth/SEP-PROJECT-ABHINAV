import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "./Button";
import ExerciseForm from "./ExerciseForm";
import {
  createWorkout,
  updateWorkout,
} from "../services/workoutService";
import {
  emptyExercise,
  formatDateISO,
  formatLongDate,
  volumeOfSet,
} from "../utils/format";

function validate(date, exercises) {
  const errors = [];
  let message = null;

  if (!date) message = "Please choose a date for this workout.";

  let hasExerciseError = false;
  exercises.forEach((ex, i) => {
    const e = {};
    if (!ex.name.trim()) {
      e.name = "Required";
      hasExerciseError = true;
    }
    if (!ex.sets || ex.sets <= 0) {
      e.sets = "Must be > 0";
      hasExerciseError = true;
    }
    if (!ex.reps || ex.reps <= 0) {
      e.reps = "Must be > 0";
      hasExerciseError = true;
    }
    if (ex.weight == null || ex.weight < 0) {
      e.weight = "Cannot be negative";
      hasExerciseError = true;
    }
    errors[i] = e;
  });

  if (!exercises.length) message = "Add at least one exercise.";
  else if (hasExerciseError) message = "Please check the exercise details.";

  return { errors, message };
}

export default function WorkoutBuilder({ initial }) {
  const navigate = useNavigate();
  const isEdit = !!initial;

  const [date, setDate] = useState(
    initial?.date || formatDateISO()
  );
  const [exercises, setExercises] = useState(
    initial?.exercises?.map((e) => ({
      name: e.name,
      sets: Number(e.sets),
      reps: Number(e.reps),
      weight: Number(e.weight),
    })) || [emptyExercise()]
  );
  const [errors, setErrors] = useState([]);
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    const { errors: errs, message } = validate(date, exercises);
    setErrors(errs);
    if (message) {
      setFormError(message);
      return;
    }

    const payload = {
      date,
      exercises: exercises.map((ex) => ({
        name: ex.name.trim(),
        sets: Number(ex.sets),
        reps: Number(ex.reps),
        weight: Number(ex.weight),
      })),
    };

    setBusy(true);
    try {
      const result = isEdit
        ? await updateWorkout(initial.id, payload)
        : await createWorkout(payload);
      setSaved(result);
    } catch (err) {
      setFormError(err.message || "Could not save workout.");
    } finally {
      setBusy(false);
    }
  };

  if (saved) {
    const total = (saved.exercises || []).reduce(
      (s, ex) => s + volumeOfSet(ex.sets, ex.reps, ex.weight),
      0
    );
    return (
      <div className="page container">
        <div className="card card-pad reveal" style={{ maxWidth: 560, margin: "3rem auto" }}>
          <span className="hero-greet">Saved</span>
          <h1 className="hero-title" style={{ fontSize: "2rem" }}>
            {isEdit ? "Workout updated" : "Workout logged"}
          </h1>
          <p className="hero-sub">
            {formatLongDate(saved.date)} · {saved.exercises.length} exercises ·{" "}
            {Math.round(total).toLocaleString()} kg volume
          </p>

          <div className="card" style={{ marginTop: "1.5rem" }}>
            {(saved.exercises || []).map((ex) => (
              <div className="detail-exercise" key={ex.id}>
                <span className="detail-name">{ex.name}</span>
                <span className="detail-stats">
                  {ex.sets} × {ex.reps} @ {ex.weight} kg
                </span>
              </div>
            ))}
          </div>

          <div className="detail-actions">
            <Button onClick={() => navigate(`/workout/${saved.id}`)} variant="ghost">
              View workout
            </Button>
            <Button onClick={() => navigate("/")}>Back to dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page container">
      <span className="hero-greet">{isEdit ? "Edit" : "New"}</span>
      <h1 className="hero-title" style={{ fontSize: "2.2rem" }}>
        {isEdit ? "Edit workout" : "Build a workout"}
      </h1>
      <p className="hero-sub">Pick a date and add the exercises you performed.</p>

      {formError && <div className="form-error">{formError}</div>}

      <form onSubmit={submit} noValidate style={{ marginTop: "1.5rem" }}>
        <div className="card card-pad" style={{ maxWidth: 560 }}>
          <div className="field" style={{ maxWidth: 260 }}>
            <label htmlFor="workout-date">Date</label>
            <input
              id="workout-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="divider" />

        <h3 className="section-title">Exercises</h3>
        <ExerciseForm
          exercises={exercises}
          onChange={setExercises}
          errors={errors}
        />

        <div style={{ marginTop: "1.75rem" }}>
          <Button type="submit" size="lg" disabled={busy} block>
            {busy ? "Saving workout…" : isEdit ? "Save changes" : "Finish workout"}
          </Button>
        </div>
      </form>
    </div>
  );
}
