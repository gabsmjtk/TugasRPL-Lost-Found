import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, User, LogOut, PlusCircle, ShieldCheck, Home, Search } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2.5 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-white font-extrabold shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                C
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl text-gray-900 tracking-tight leading-none">
                  Campus<span className="text-emerald-600">Find</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase mt-0.5">
                  Lost & Found Kampus
                </span>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/') ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <Home size={16} /> Beranda
            </Link>

            <Link
              to="/reports"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                isActive('/reports') ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
              }`}
            >
              <Search size={16} /> Cari Laporan
            </Link>

            {user && (
              <Link
                to="/reports/create"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive('/reports/create') ? 'text-emerald-700 bg-emerald-50 font-semibold' : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                }`}
              >
                <PlusCircle size={16} /> Buat Laporan
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <Link
                  to={user.Role === 'ADMIN' ? '/admin' : '/dashboard'}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/admin') || isActive('/dashboard')
                      ? 'text-emerald-700 bg-emerald-50 font-semibold'
                      : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                  }`}
                >
                  {user.Role === 'ADMIN' ? <ShieldCheck size={16} className="text-emerald-600" /> : <User size={16} />}
                  Dashboard {user.Role === 'ADMIN' ? 'Admin' : ''}
                </Link>

                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200/80 px-3 py-1.5 rounded-full">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {user.Name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[120px]">
                      {user.Name}
                    </span>
                    <span className="text-[10px] text-gray-400 leading-none">
                      {user.Role === 'ADMIN' ? 'Petugas' : 'Mahasiswa'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  title="Keluar"
                  className="text-gray-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 pl-2">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Home size={18} /> Beranda
          </Link>
          <Link
            to="/reports"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Search size={18} /> Cari Laporan
          </Link>

          {user && (
            <Link
              to="/reports/create"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <PlusCircle size={18} /> Buat Laporan
            </Link>
          )}

          {user ? (
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="px-3 py-2 flex items-center gap-2 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  {user.Name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-900">{user.Name}</div>
                  <div className="text-xs text-gray-500">{user.Email}</div>
                </div>
              </div>
              <Link
                to={user.Role === 'ADMIN' ? '/admin' : '/dashboard'}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50"
              >
                Dashboard {user.Role === 'ADMIN' ? 'Admin' : 'Mahasiswa'}
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut size={18} /> Keluar
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                Daftar Akun Baru
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
