import { api } from "./api";

export function getWorkouts(params = {}) {
  const query = new URLSearchParams();
  if (params.date) query.set("date", params.date);
  const qs = query.toString();
  return api.get(`/workouts/${qs ? `?${qs}` : ""}`);
}

export function getWorkout(id) {
  return api.get(`/workouts/${id}/`);
}

export function createWorkout(payload) {
  return api.post("/workouts/", payload);
}

export function updateWorkout(id, payload) {
  return api.patch(`/workouts/${id}/`, payload);
}

export function deleteWorkout(id) {
  return api.delete(`/workouts/${id}/`);
}

export function getStats() {
  return api.get("/workouts/stats/");
}
