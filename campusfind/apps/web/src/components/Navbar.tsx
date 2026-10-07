import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Search, User, LogOut, Bell, Shield, LayoutDashboard, Plus } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm shadow-md group-hover:shadow-emerald-200 transition-shadow">
              C
            </div>
            <span className="font-extrabold text-gray-900 tracking-tight text-lg">
              Campus<span className="text-emerald-600">Find</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/reports" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
              <span className="flex items-center gap-1.5"><Search size={15} /> Cari Barang</span>
            </Link>
            {user && (
              <>
                {user.Role === 'ADMIN' ? (
                  <Link to="/admin" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all flex items-center gap-1.5">
                    <Shield size={15} /> Admin
                  </Link>
                ) : (
                  <>
                    <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all flex items-center gap-1.5">
                      <LayoutDashboard size={15} /> Dashboard
                    </Link>
                    <Link to="/reports/create" className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all flex items-center gap-1.5">
                      <Plus size={15} /> Buat Laporan
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.Name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">{user.Name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Keluar"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors">
                  Masuk
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm">
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 py-3 px-4 space-y-1">
          <Link to="/reports" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
            <Search size={16} /> Cari Barang
          </Link>
          {user ? (
            <>
              {user.Role === 'ADMIN' ? (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                  <Shield size={16} /> Admin Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                    <LayoutDashboard size={16} /> Dashboard Saya
                  </Link>
                  <Link to="/reports/create" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg">
                    <Plus size={16} /> Buat Laporan
                  </Link>
                </>
              )}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <div className="px-4 py-2 text-xs text-gray-400">Masuk sebagai {user.Name}</div>
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg">
                  <LogOut size={16} /> Keluar
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg">
                Masuk
              </Link>
              <Link to="/register" onClick={() => setMobileOpen(false)} className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-lg">
                Daftar
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
