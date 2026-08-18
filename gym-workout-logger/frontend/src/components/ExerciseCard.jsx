import { COMMON_EXERCISES } from "../utils/format";

export default function ExerciseCard({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
  error,
}) {
  const update = (field, fieldValue) => {
    onChange(index, { ...value, [field]: fieldValue });
  };

  return (
    <div className="exercise">
      <div className="exercise-head">
        <span className="exercise-index">Exercise {String(index + 1).padStart(2, "0")}</span>
        <button
          type="button"
          className="btn-link"
          onClick={() => onRemove(index)}
          disabled={!canRemove}
          style={{ color: canRemove ? "var(--danger)" : "var(--muted-2)" }}
        >
          Remove
        </button>
      </div>

      <div className="field-grid">
        <div className="field">
          <label htmlFor={`name-${index}`}>Name</label>
          <input
            id={`name-${index}`}
            list={`exercises-${index}`}
            placeholder="e.g. Bench Press"
            value={value.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={!!error?.name}
          />
          <datalist id={`exercises-${index}`}>
            {COMMON_EXERCISES.map((name) => (
              <option value={name} key={name} />
            ))}
          </datalist>
          {error?.name && <span className="field-error">{error.name}</span>}
        </div>

        <div className="field">
          <label htmlFor={`sets-${index}`}>Sets</label>
          <input
            id={`sets-${index}`}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={value.sets === 0 ? "" : value.sets}
            onChange={(e) =>
              update("sets", e.target.value === "" ? 0 : Number(e.target.value))
            }
            aria-invalid={!!error?.sets}
          />
          {error?.sets && <span className="field-error">{error.sets}</span>}
        </div>

        <div className="field">
          <label htmlFor={`reps-${index}`}>Reps</label>
          <input
            id={`reps-${index}`}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={value.reps === 0 ? "" : value.reps}
            onChange={(e) =>
              update("reps", e.target.value === "" ? 0 : Number(e.target.value))
            }
            aria-invalid={!!error?.reps}
          />
          {error?.reps && <span className="field-error">{error.reps}</span>}
        </div>

        <div className="field">
          <label htmlFor={`weight-${index}`}>Weight (kg)</label>
          <input
            id={`weight-${index}`}
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={value.weight === 0 ? "" : value.weight}
            onChange={(e) =>
              update(
                "weight",
                e.target.value === "" ? 0 : Number(e.target.value)
              )
            }
            aria-invalid={!!error?.weight}
          />
          {error?.weight && <span className="field-error">{error.weight}</span>}
        </div>
      </div>
    </div>
  );
}
