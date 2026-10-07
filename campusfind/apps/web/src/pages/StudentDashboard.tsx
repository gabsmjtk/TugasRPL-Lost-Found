import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { StudentDashboardResponse, ReportSummary, ClaimSummary } from '@campusfind/shared';
import { 
  PackageOpen, 
  HelpCircle, 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Layers 
} from 'lucide-react';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardResponse | null>(null);
  const [allReports, setAllReports] = useState<ReportSummary[]>([]);
  const [allClaims, setAllClaims] = useState<ClaimSummary[]>([]);
  const [activeTab, setActiveTab] = useState<'REPORTS' | 'CLAIMS'>('REPORTS');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [dashRes, reportsRes, claimsRes] = await Promise.all([
        api.get('/me/dashboard'),
        api.get('/me/reports'),
        api.get('/me/claims')
      ]);
      setData(dashRes.data);
      setAllReports(reportsRes.data);
      setAllClaims(claimsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteReport = async (reportId: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus laporan "${title}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.delete(`/reports/${reportId}`);
      alert('Laporan berhasil dihapus.');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal menghapus laporan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkFound = async (reportId: string) => {
    if (!window.confirm('Tandai barang ini sebagai sudah ditemukan kembali? Status laporan akan diubah menjadi MATCHED.')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/reports/${reportId}/mark-found`);
      alert('Laporan berhasil ditandai sebagai sudah ditemukan!');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal mengubah status laporan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelClaim = async (claimId: string) => {
    if (!window.confirm('Batalkan pengajuan klaim ini?')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/claims/${claimId}/cancel`);
      alert('Klaim berhasil dibatalkan.');
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal membatalkan klaim.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Memuat informasi dashboard...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-rose-500 font-bold mb-4">Gagal memuat data dashboard.</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Welcome & Quick Action Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-emerald-200 text-xs font-bold uppercase tracking-wider">
            Portal Mahasiswa Kampus
          </span>
          <h1 className="text-3xl font-black mt-1">Halo, {user?.Name}!</h1>
          <p className="text-emerald-100 text-sm mt-1 max-w-xl">
            Kelola laporan barang hilang atau temuan Anda serta pantau persetujuan klaim kepemilikan.
          </p>
        </div>

        {/* Quick Report Buttons - LOST & FOUND */}
        <div className="flex flex-wrap gap-3">
          <Link
            to="/reports/create?type=LOST"
            className="inline-flex items-center gap-2 bg-white text-rose-600 hover:bg-rose-50 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5"
          >
            <HelpCircle size={18} />
            Lapor Barang Hilang
          </Link>
          <Link
            to="/reports/create?type=FOUND"
            className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md transition-all transform hover:-translate-y-0.5 border border-emerald-400/40"
          >
            <PackageOpen size={18} />
            Lapor Barang Ditemukan
          </Link>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Layers size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Laporan Saya</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{data.Summary.MyReportsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Klaim Berjalan</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{data.Summary.ActiveClaimsCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={28} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Barang Dikembalikan</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{data.Summary.ReturnedItemsCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs navigation for Reports vs Claims */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 flex px-6 pt-4 gap-4 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`pb-4 px-2 font-bold text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === 'REPORTS'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers size={18} />
            Daftar Laporan Saya ({allReports.length})
          </button>

          <button
            onClick={() => setActiveTab('CLAIMS')}
            className={`pb-4 px-2 font-bold text-sm border-b-2 flex items-center gap-2 transition ${
              activeTab === 'CLAIMS'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertCircle size={18} />
            Klaim Saya ({allClaims.length})
          </button>
        </div>

        {/* Tab 1: All Reports */}
        {activeTab === 'REPORTS' && (
          <div className="p-6">
            {allReports.length === 0 ? (
              <div className="p-12 text-center">
                <Layers size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-700 text-base">Belum Ada Laporan</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Anda belum pernah membuat laporan kehilangan maupun barang temuan.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <Link
                    to="/reports/create?type=LOST"
                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Lapor Barang Hilang
                  </Link>
                  <Link
                    to="/reports/create?type=FOUND"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Lapor Barang Ditemukan
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allReports.map((report) => {
                  const canDelete = report.Status === 'PENDING' || report.Status === 'OPEN';
                  const canMarkFound = report.Type === 'LOST' && report.Status === 'OPEN';

                  return (
                    <div
                      key={report.Id}
                      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <TypeBadge type={report.Type} size="sm" />
                          <StatusBadge status={report.Status} size="sm" />
                        </div>

                        <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">{report.Title}</h3>
                        <p className="text-xs text-gray-500 mb-3">Kategori: {report.CategoryName}</p>

                        <div className="space-y-1 text-xs text-gray-500 mb-4 bg-gray-50 p-2.5 rounded-xl">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-gray-400 shrink-0" />
                            <span className="truncate">{report.Location}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400 shrink-0" />
                            <span>{new Date(report.EventAt).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons on card */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        {report.Status !== 'PENDING' ? (
                          <Link
                            to={`/reports/${report.Id}`}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                          >
                            <ExternalLink size={14} /> Lihat Detail
                          </Link>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium italic">
                            Menunggu verifikasi admin
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {canMarkFound && (
                            <button
                              onClick={() => handleMarkFound(report.Id)}
                              disabled={actionLoading}
                              title="Tandai Ditemukan"
                              className="px-2.5 py-1 text-[11px] font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition"
                            >
                              Sudah Ketemu
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => handleDeleteReport(report.Id, report.Title)}
                              disabled={actionLoading}
                              title="Hapus Laporan"
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: All Claims */}
        {activeTab === 'CLAIMS' && (
          <div className="p-6">
            {allClaims.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle size={40} className="mx-auto text-gray-300 mb-3" />
                <h3 className="font-bold text-gray-700 text-base">Belum Ada Klaim</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Jika Anda melihat barang temuan milik Anda di menu Cari Laporan, Anda dapat mengajukan klaim kepemilikan.
                </p>
                <Link
                  to="/reports?Type=FOUND"
                  className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold"
                >
                  Cari Barang Temuan
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {allClaims.map((claim) => (
                  <div
                    key={claim.Id}
                    className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase">Klaim Barang:</span>
                        <h4 className="font-bold text-gray-900 text-base">{claim.ReportTitle}</h4>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                          claim.Status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          claim.Status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          claim.Status === 'COMPLETED' ? 'bg-teal-100 text-teal-800' :
                          claim.Status === 'CANCELLED' ? 'bg-gray-100 text-gray-600' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {claim.Status === 'PENDING' ? 'Menunggu Review Petugas' :
                           claim.Status === 'APPROVED' ? 'Disetujui (Silakan Ambil Barang)' :
                           claim.Status === 'COMPLETED' ? 'Selesai (Sudah Diserahkan)' :
                           claim.Status === 'CANCELLED' ? 'Dibatalkan' : 'Ditolak'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600">
                        <span className="font-semibold text-gray-700">Bukti Anda:</span> {claim.ProofAnswer}
                      </p>

                      {claim.DecisionNote && (
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 mt-2">
                          <span className="font-bold text-gray-800">Catatan Petugas:</span> {claim.DecisionNote}
                        </div>
                      )}

                      <p className="text-[11px] text-gray-400 pt-1">
                        Diajukan: {new Date(claim.CreatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {claim.Status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelClaim(claim.Id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition"
                        >
                          Batalkan Klaim
                        </button>
                      )}

                      <Link
                        to={`/reports/${claim.ReportId}`}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                      >
                        Lihat Barang
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
