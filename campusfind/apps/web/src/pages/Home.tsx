import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Search, MapPin, AlertTriangle, CheckCircle2, PackageCheck,
  Plus, ArrowRight, ChevronRight, Loader2, FileText
} from 'lucide-react';

interface Stats {
  OpenLostReports: number;
  OpenFoundReports: number;
  CompletedHandovers: number;
}

interface Report {
  Id: string;
  Type: string;
  Status: string;
  Title: string;
  CategoryName: string;
  Location: string;
  EventAt: string;
  CreatedAt: string;
  ImageUrl?: string;
  ReporterName: string;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/reports/stats'),
      api.get('/reports?PageSize=6'),
    ]).then(([statsRes, reportsRes]) => {
      setStats(statsRes.data);
      setRecentReports(reportsRes.data.Data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/reports?Search=${encodeURIComponent(searchQuery)}`);
  };

  const handleCTA = (type: 'lost' | 'found') => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/reports/create?type=${type}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <CheckCircle2 size={14} /> Sistem Informasi Barang Hilang &amp; Temuan Kampus
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Temukan Barang<br />
              <span className="text-emerald-200">Hilang Anda</span>
            </h1>
            <p className="text-lg md:text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
              CampusFind menghubungkan pelapor barang hilang dengan penemu barang di kampus secara terstruktur, cepat, dan terpercaya.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-10">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari barang (contoh: dompet, kunci, laptop)..."
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 shadow-lg"
                />
              </div>
              <button type="submit" className="px-6 py-3.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg text-sm whitespace-nowrap">
                Cari
              </button>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handleCTA('lost')}
                className="flex items-center justify-center gap-2 px-7 py-3.5 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-red-500/30 hover:-translate-y-0.5"
              >
                <AlertTriangle size={18} /> Laporkan Barang Hilang
              </button>
              <button
                onClick={() => handleCTA('found')}
                className="flex items-center justify-center gap-2 px-7 py-3.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl backdrop-blur border border-white/30 transition-all hover:-translate-y-0.5"
              >
                <PackageCheck size={18} /> Laporkan Barang Ditemukan
              </button>
              <Link
                to="/reports"
                className="flex items-center justify-center gap-2 px-7 py-3.5 bg-transparent hover:bg-white/10 text-white/80 hover:text-white font-semibold rounded-xl border border-white/20 transition-all"
              >
                <Search size={18} /> Cari Barang
              </Link>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L60 50C120 40 240 20 360 16.7C480 13.3 600 26.7 720 30C840 33.3 960 26.7 1080 23.3C1200 20 1320 20 1380 20L1440 20V60H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {[
              { label: 'Laporan Hilang Aktif', value: stats?.OpenLostReports, color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
              { label: 'Laporan Temuan Aktif', value: stats?.OpenFoundReports, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: PackageCheck },
              { label: 'Barang Dikembalikan', value: stats?.CompletedHandovers, color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle2 },
            ].map(({ label, value, color, bg, icon: Icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={color} size={20} />
                </div>
                <div className={`text-2xl md:text-3xl font-extrabold ${color}`}>
                  {loading ? <Loader2 className="animate-spin mx-auto" size={22} /> : value ?? 0}
                </div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-amber-800">
            <strong>Privasi Anda penting.</strong> Jangan cantumkan nomor KTP, PIN, kata sandi, atau informasi pribadi sensitif lainnya dalam deskripsi laporan publik.
          </p>
        </div>
      </section>

      {/* Recent reports */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Laporan Terbaru</h2>
            <p className="text-sm text-gray-500 mt-1">Laporan yang telah diverifikasi petugas</p>
          </div>
          <Link to="/reports" className="flex items-center gap-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
            Lihat Semua <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-emerald-500" size={36} />
          </div>
        ) : recentReports.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Belum ada laporan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReports.map((r) => (
              <Link
                key={r.Id}
                to={`/reports/${r.Id}`}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all overflow-hidden"
              >
                {r.ImageUrl ? (
                  <div className="h-40 bg-gray-100 overflow-hidden">
                    <img
                      src={`http://localhost:3001${r.ImageUrl}`}
                      alt={r.Title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <FileText className="text-gray-300" size={40} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex gap-1.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.Type === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {r.Type === 'LOST' ? 'Hilang' : 'Ditemukan'}
                      </span>
                      <StatusBadge status={r.Status} size="sm" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">{r.Title}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin size={11} /> {r.Location}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">{new Date(r.CreatedAt).toLocaleDateString('id-ID')}</span>
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                      Lihat <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
