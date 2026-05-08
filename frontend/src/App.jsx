import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import JobsPage from './pages/JobsPage';
import ApplicationsPage from './pages/ApplicationsPage';
import StudentProfile from './pages/StudentProfile';
import RecruiterProfile from './pages/RecruiterProfile';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'STUDENT') return <Navigate to="/student-dashboard" replace />;
  return <Navigate to="/recruiter-dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route path="/student-dashboard" element={
        <ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>
      } />
      <Route path="/recruiter-dashboard" element={
        <ProtectedRoute roles={['RECRUITER', 'ADMIN']}><RecruiterDashboard /></ProtectedRoute>
      } />
      <Route path="/jobs" element={
        <ProtectedRoute><JobsPage /></ProtectedRoute>
      } />
      <Route path="/applications" element={
        <ProtectedRoute><ApplicationsPage /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute roles={['STUDENT']}><StudentProfile /></ProtectedRoute>
      } />
      <Route path="/recruiter-profile" element={
        <ProtectedRoute roles={['RECRUITER', 'ADMIN']}><RecruiterProfile /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
