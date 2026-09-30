import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.Role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              <div className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
                  <div className="text-center max-w-3xl mx-auto">
                    <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
                      Temukan Kembali <span className="text-primary-600">Barang Berharga</span> Anda
                    </h1>
                    <p className="text-xl text-gray-600 mb-10">
                      Platform resmi informasi kehilangan dan penemuan barang di area kampus. Laporkan sekarang, kami bantu mempertemukan.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a href="/reports/create?type=LOST" className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                        Laporkan Barang Hilang
                      </a>
                      <a href="/reports/create?type=FOUND" className="px-8 py-4 bg-white border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-800 rounded-full font-semibold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
                        Laporkan Barang Ditemukan
                      </a>
                    </div>
                  </div>
                </div>
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                  <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-300/30 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-300/30 rounded-full blur-3xl"></div>
                </div>
              </div>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><div>Admin Dashboard (To be implemented)</div></ProtectedRoute>} />
            <Route path="/reports" element={<div>Cari Laporan (To be implemented)</div>} />
            <Route path="/reports/create" element={<ProtectedRoute><div>Buat Laporan (To be implemented)</div></ProtectedRoute>} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">C</div>
              <span className="font-bold text-gray-900">CampusFind</span>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} CampusFind. Hak Cipta Dilindungi.
            </p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}

export default App;
