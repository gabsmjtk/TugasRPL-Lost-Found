import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  FileText, Send, RotateCcw, Plus, LayoutDashboard,
  Loader2, AlertCircle, ChevronRight, MapPin, Calendar, AlertTriangle, PackageCheck
} from 'lucide-react';

interface Report {
  Id: string; Type: string; Status: string; Title: string;
  CategoryName: string; Location: string; UpdatedAt: string; CreatedAt: string;
}
interface Claim {
  Id: string; ReportTitle: string; Status: string;
  DecisionNote?: string; CreatedAt: string; UpdatedAt: string;
}
interface DashboardData {
  MyReports: Report[];
  MyClaims: Claim[];
  Summary: { MyReportsCount: number; ActiveClaimsCount: number; ReturnedItemsCount: number; };
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/me/dashboard')
      .then(r => setData(r.data))
      .catch(() => setError('Gagal memuat dashboard'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-500" size={36} /></div>;
  if (error) return (
    <div className="flex flex-col items-center py-24 text-center">
      <AlertCircle className="text-red-400 mb-3" size={40} />
      <p className="text-red-600 font-medium">{error}</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Selamat datang, {user?.Name.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Kelola laporan dan klaim barang Anda di sini</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/reports/create?type=lost"
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <AlertTriangle size={15} /> Laporkan Hilang
          </Link>
          <Link
            to="/reports/create?type=found"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <PackageCheck size={15} /> Laporkan Temuan
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Total Laporan Saya', value: data?.Summary.MyReportsCount,
            icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100',
          },
          {
            label: 'Klaim Aktif', value: data?.Summary.ActiveClaimsCount,
            icon: Send, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100',
          },
          {
            label: 'Barang Dikembalikan', value: data?.Summary.ReturnedItemsCount,
            icon: RotateCcw, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100',
          },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={`bg-white rounded-2xl border ${border} shadow-sm p-5`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                <Icon className={color} size={20} />
              </div>
              <div>
                <div className={`text-2xl font-extrabold ${color}`}>{value ?? 0}</div>
                <div className="text-xs text-gray-500 font-medium">{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My reports */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={18} className="text-gray-400" /> Laporan Terbaru
            </h2>
            <Link to="/me/reports" className="text-xs text-emerald-600 hover:underline flex items-center gap-0.5">
              Lihat semua <ChevronRight size={12} />
            </Link>
          </div>
          {data?.MyReports.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto mb-3 text-gray-300" size={36} />
              <p className="text-sm text-gray-500 mb-3">Belum ada laporan</p>
              <Link to="/reports/create" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:underline">
                <Plus size={14} /> Buat laporan pertama
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data?.MyReports.slice(0, 5).map(r => (
                <Link key={r.Id} to={`/reports/${r.Id}`} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${r.Type === 'LOST' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{r.Title}</p>
                      <StatusBadge status={r.Status} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} /> {r.Location}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={10} /> {new Date(r.UpdatedAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="p-4 border-t border-gray-50">
            <Link
              to="/reports/create"
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
            >
              <Plus size={15} /> Buat Laporan Baru
            </Link>
          </div>
        </div>

        {/* My claims */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Send size={18} className="text-gray-400" /> Klaim Saya
            </h2>
          </div>
          {data?.MyClaims.length === 0 ? (
            <div className="p-8 text-center">
              <Send className="mx-auto mb-3 text-gray-300" size={36} />
              <p className="text-sm text-gray-500">Belum ada klaim yang diajukan</p>
              <p className="text-xs text-gray-400 mt-1">Cari laporan barang ditemukan untuk mengajukan klaim</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data?.MyClaims.slice(0, 5).map(c => (
                <div key={c.Id} className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{c.ReportTitle}</p>
                    <StatusBadge status={c.Status} size="sm" />
                  </div>
                  {c.DecisionNote && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">Catatan: {c.DecisionNote}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{new Date(c.UpdatedAt).toLocaleDateString('id-ID')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
