import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import AddAchievementPage from './pages/AddAchievementPage';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import PublicProfile from './pages/PublicProfile';
import StudentDashboard from './pages/StudentDashboard';

const HomeRedirect = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginPage />;
  }

  return <Navigate to={user.role === 'Admin' ? '/admin' : '/student'} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRole="Student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-achievement"
        element={
          <ProtectedRoute allowedRole="Student">
            <AddAchievementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRole="Admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />
      <Route path="/profile/:id" element={<PublicProfile />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
