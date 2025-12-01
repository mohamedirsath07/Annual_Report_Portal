import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageDepartments from './pages/admin/ManageDepartments';
import ManageReports from './pages/admin/ManageReports';
import FacultyDashboard from './pages/faculty/FacultyDashboard';
import VerifyData from './pages/faculty/VerifyData';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAddAchievement from './pages/student/AddAchievement';

// Simple Route Protection Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!token || !user) return <Navigate to="/" />;
  if (user.role !== allowedRole) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRole="admin">
            <ManageUsers />
          </ProtectedRoute>
        } />
        <Route path="/admin/departments" element={
          <ProtectedRoute allowedRole="admin">
            <ManageDepartments />
          </ProtectedRoute>
        } />
        <Route path="/admin/reports" element={
          <ProtectedRoute allowedRole="admin">
            <ManageReports />
          </ProtectedRoute>
        } />

        {/* Faculty Routes */}
        <Route path="/faculty" element={
          <ProtectedRoute allowedRole="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/faculty/verify" element={
          <ProtectedRoute allowedRole="faculty">
            <VerifyData />
          </ProtectedRoute>
        } />

        {/* Student Routes */}
        <Route path="/student" element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/student/achievements" element={
          <ProtectedRoute allowedRole="student">
            <StudentAddAchievement />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
