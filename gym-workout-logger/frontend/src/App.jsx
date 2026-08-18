import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NewWorkout from "./pages/NewWorkout";
import WorkoutDetail from "./pages/WorkoutDetail";
import WorkoutHistory from "./pages/WorkoutHistory";
import Progress from "./pages/Progress";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ProtectedRoute>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<NewWorkout />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/history" element={<WorkoutHistory />} />
            <Route path="/workout/:id" element={<WorkoutDetail />} />
          </Routes>
        </ProtectedRoute>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </AuthProvider>
    </Router>
  );
}