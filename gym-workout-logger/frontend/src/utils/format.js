export const COMMON_EXERCISES = [
  "Bench Press",
  "Incline Bench Press",
  "Squat",
  "Deadlift",
  "Romanian Deadlift",
  "Lat Pulldown",
  "Pull Up",
  "Barbell Row",
  "Dumbbell Row",
  "Shoulder Press",
  "Lateral Raise",
  "Bicep Curl",
  "Hammer Curl",
  "Tricep Pushdown",
  "Skull Crusher",
  "Leg Press",
  "Leg Extension",
  "Leg Curl",
  "Calf Raise",
];

export function formatDateISO(date = new Date()) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatLongDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShortDate(iso) {
  const d = new Date(`${iso}T00:00:00`);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS[d.getMonth()].slice(0, 3).toUpperCase();
  return { day, mon };
}

export function emptyExercise() {
  return { name: "", sets: 0, reps: 0, weight: 0 };
}

export function greetingForHour(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function volumeOfSet(sets, reps, weight) {
  const s = Number(sets) || 0;
  const r = Number(reps) || 0;
  const w = Number(weight) || 0;
  return s * r * w;
}
