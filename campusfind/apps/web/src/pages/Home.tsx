import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  HelpCircle, 
  CheckCircle2, 
  PackageOpen, 
  FileText,
  Sparkles,
  Info
} from 'lucide-react';
import api from '../services/api';
import { ReportSummary } from '@campusfind/shared';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ OpenLostCount: 0, OpenFoundCount: 0, ReturnedCount: 0 });
  const [recentReports, setRecentReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [statsRes, reportsRes] = await Promise.all([
          api.get('/reports/stats').catch(() => ({ data: { OpenLostCount: 0, OpenFoundCount: 0, ReturnedCount: 0 } })),
          api.get('/reports?Page=1&PageSize=6&Sort=newest').catch(() => ({ data: { Data: [] } }))
        ]);
        setStats(statsRes.data);
        setRecentReports(reportsRes.data.Data || []);
      } catch (err) {
        console.error('Failed to load home data', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/reports?Search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/reports');
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 bg-gradient-to-b from-emerald-50/60 via-slate-50 to-slate-50 border-b border-emerald-100/40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute -top-24 left-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm border border-emerald-200">
            <Sparkles size={14} className="text-emerald-600" />
            Sistem Resmi Informasi Lost & Found Kampus
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.15] mb-6">
            Temukan Kembali{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
              Barang Berharga
            </span>{' '}
            Anda di Kampus
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Platform terpusat dan terverifikasi untuk melaporkan barang hilang, mengamankan barang temuan,
            dan mengajukan klaim kepemilikan secara aman & transparan.
          </p>

          {/* Search Box in Hero */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-8">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-emerald-950/5 border border-gray-200 p-2 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all">
              <Search className="h-6 w-6 text-gray-400 ml-3 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan nama barang, lokasi, atau kategori..."
                className="w-full py-2.5 px-2 text-gray-800 text-sm sm:text-base focus:outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-md shrink-0"
              >
                Cari Barang
              </button>
            </div>
          </form>

          {/* Quick Action CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/reports/create?type=LOST"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-600/25 hover:shadow-xl hover:shadow-rose-600/35 transition-all transform hover:-translate-y-0.5"
            >
              <HelpCircle size={18} />
              Laporkan Barang Hilang
            </Link>
            <Link
              to="/reports/create?type=FOUND"
              className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 transition-all transform hover:-translate-y-0.5"
            >
              <PackageOpen size={18} />
              Laporkan Barang Ditemukan
            </Link>
          </div>

          {/* Important Security Notice Note as requested in requirement */}
          <div className="mt-8 max-w-xl mx-auto flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-left text-xs text-amber-800">
            <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Perhatian Privasi:</strong> Hindari mencantumkan data pribadi yang sangat sensitif (misal: PIN ATM, nomor rekening, kata sandi) pada deskripsi laporan publik.
            </span>
          </div>
        </div>
      </section>

      {/* Summary Statistics Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <HelpCircle size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Laporan Kehilangan Terbuka</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{stats.OpenLostCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <PackageOpen size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Barang Ditemukan Terverifikasi</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{stats.OpenFoundCount}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Berhasil Dikembalikan</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{stats.ReturnedCount}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Verified Reports Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck size={16} /> Terverifikasi Petugas
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Laporan Terbaru</h2>
          </div>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 group"
          >
            Lihat Semua Laporan
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
            <FileText size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="font-bold text-gray-700 text-lg">Belum Ada Laporan Terbuka</h3>
            <p className="text-gray-500 text-sm mt-1">Saat ini belum ada laporan kehilangan atau barang temuan aktif.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentReports.map((report) => (
              <Link
                key={report.Id}
                to={`/reports/${report.Id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-200/60 transition-all p-5 flex flex-col group"
              >
                {report.ImageUrl && (
                  <div className="w-full h-44 rounded-xl overflow-hidden mb-4 bg-gray-100">
                    <img
                      src={report.ImageUrl}
                      alt={report.Title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between gap-2 mb-3">
                  <TypeBadge type={report.Type} />
                  <StatusBadge status={report.Status} size="sm" />
                </div>

                <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                  {report.Title}
                </h3>

                <p className="text-xs text-gray-500 font-medium mb-4 bg-gray-50 px-2.5 py-1 rounded-md self-start">
                  Kategori: {report.CategoryName}
                </p>

                <div className="mt-auto pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-gray-400 shrink-0" />
                    <span className="truncate">{report.Location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} className="text-gray-400 shrink-0" />
                    <span>{new Date(report.EventAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
