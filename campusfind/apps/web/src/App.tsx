import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Reports from './pages/Reports';
import ReportDetailPage from './pages/ReportDetail';
import CreateReport from './pages/CreateReport';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin }: { children: React.ReactNode; requireAdmin?: boolean }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.Role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Public report catalog and details */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/:id" element={<ReportDetailPage />} />
            
            {/* Protected Student & General creation routes */}
            <Route
              path="/reports/create"
              element={
                <ProtectedRoute>
                  <CreateReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                C
              </div>
              <span className="font-extrabold text-gray-900 tracking-tight">CampusFind</span>
              <span className="text-gray-400 text-xs pl-2 border-l border-gray-200">
                Sistem Informasi Kehilangan & Temuan Kampus
              </span>
            </div>
            <p className="text-gray-400 text-xs text-center md:text-right">
              &copy; {new Date().getFullYear()} CampusFind. Seluruh hak cipta dilindungi undang-undang.
            </p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;