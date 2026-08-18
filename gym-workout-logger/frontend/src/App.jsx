import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NewWorkout from "./pages/NewWorkout";
import EditWorkout from "./pages/EditWorkout";
import WorkoutDetail from "./pages/WorkoutDetail";
import WorkoutHistory from "./pages/WorkoutHistory";
import Progress from "./pages/Progress";

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/new" element={<NewWorkout />} />
            <Route path="/workout/:id/edit" element={<EditWorkout />} />
            <Route path="/workout/:id" element={<WorkoutDetail />} />
            <Route path="/history" element={<WorkoutHistory />} />
            <Route path="/progress" element={<Progress />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}