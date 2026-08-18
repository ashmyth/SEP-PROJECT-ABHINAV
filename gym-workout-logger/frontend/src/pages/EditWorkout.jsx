import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WorkoutBuilder from "../components/WorkoutBuilder";
import Loading from "../components/Loading";

export default function EditWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    import("../services/workoutService")
      .then((m) => m.getWorkout(id))
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

  if (status === "loading") return <Loading label="Loading workout…" />;
  if (status === "error")
    return (
      <div className="page container">
        <div className="card card-pad" style={{ maxWidth: 520, margin: "3rem auto" }}>
          <h1 className="auth-title">Workout not found</h1>
          <p className="hero-sub">{error}</p>
          <div style={{ marginTop: "1.5rem" }}>
            <button className="btn btn-ghost" onClick={() => navigate("/history")}>
              Back to history
            </button>
          </div>
        </div>
      </div>
    );

  return <WorkoutBuilder initial={workout} />;
}
