import { emptyExercise } from "../utils/format";
import ExerciseCard from "./ExerciseCard";

export default function ExerciseForm({ exercises, onChange, errors = [] }) {
  const updateAt = (index, exercise) => {
    const next = exercises.slice();
    next[index] = exercise;
    onChange(next);
  };

  const removeAt = (index) => {
    if (exercises.length <= 1) return;
    onChange(exercises.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...exercises, emptyExercise()]);
  };

  return (
    <div>
      {exercises.map((exercise, index) => (
        <ExerciseCard
          key={index}
          index={index}
          value={exercise}
          onChange={updateAt}
          onRemove={removeAt}
          canRemove={exercises.length > 1}
          error={errors[index]}
        />
      ))}

      <button type="button" className="btn btn-ghost" onClick={add}>
        + Add Exercise
      </button>
    </div>
  );
}
