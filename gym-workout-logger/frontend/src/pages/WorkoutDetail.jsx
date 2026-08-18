import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import Button from "../components/Button";
import { getWorkout, deleteWorkout } from "../services/workoutService";
import { formatLongDate, volumeOfSet } from "../utils/format";

export default function WorkoutDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [workout, setWorkout] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    getWorkout(id)
      .then((data) => {
        if (!active) return;
        setWorkout(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Could not load this workout.");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [id]);

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteWorkout(id);
      navigate("/history");
    } catch (err) {
      setError(err.message || "Could not delete workout.");
      setConfirmOpen(false);
      setDeleting(false);
    }
  };

  if (status === "loading") return <Loading label="Loading workout…" />;

  if (status === "error") {
    return (
      <div className="page container">
        <div className="card card-pad" style={{ maxWidth: 520, margin: "3rem auto" }}>
          <h1 className="auth-title">Workout not found</h1>
          <p className="hero-sub">{error}</p>
          <div style={{ marginTop: "1.5rem" }}>
            <Button variant="ghost" onClick={() => navigate("/history")}>
              Back to history
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const exercises = workout.exercises || [];

  return (
    <div className="page container" style={{ maxWidth: 720 }}>
      <span className="hero-greet">{formatLongDate(workout.date)}</span>
      <h1 className="hero-title" style={{ fontSize: "2.2rem" }}>
        Workout
      </h1>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        {exercises.length === 0 && (
          <div className="empty">No exercises recorded.</div>
        )}
        {exercises.map((ex) => (
          <div className="detail-exercise" key={ex.id}>
            <div>
              <div className="detail-name">{ex.name}</div>
              <div className="detail-volume">
                {Math.round(
                  volumeOfSet(ex.sets, ex.reps, ex.weight)
                ).toLocaleString()}{" "}
                kg volume
              </div>
            </div>
            <div className="detail-stats">
              {ex.sets} × {ex.reps} @ {ex.weight} kg
            </div>
          </div>
        ))}
      </div>

      <div className="detail-actions">
        <Button onClick={() => navigate(`/workout/${workout.id}/edit`)}>
          Edit workout
        </Button>
        <Button variant="danger" onClick={() => setConfirmOpen(true)}>
          Delete workout
        </Button>
      </div>

      <Modal
        open={confirmOpen}
        title="Delete this workout?"
        confirmLabel="Delete workout"
        cancelLabel="Cancel"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        busy={deleting}
      >
        This will permanently remove the workout and all of its exercises. This
        action cannot be undone.
      </Modal>
    </div>
  );
}
