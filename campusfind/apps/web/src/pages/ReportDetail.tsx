import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  Tag, 
  CheckCircle, 
  HandMetal, 
  AlertCircle, 
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ReportDetail } from '@campusfind/shared';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Claim Modal states
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [proofAnswer, setProofAnswer] = useState('');
  const [ownershipDescription, setOwnershipDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimError, setClaimError] = useState('');

  // Mark Found action state
  const [markingFound, setMarkingFound] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${id}`);
      setReport(res.data);
    } catch (err: any) {
      setError(err.response?.data?.Message || 'Laporan tidak ditemukan atau belum diverifikasi oleh petugas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError('');
    setClaimSuccess('');
    setSubmittingClaim(true);

    try {
      await api.post(`/reports/${id}/claims`, {
        ProofAnswer: proofAnswer,
        OwnershipDescription: ownershipDescription,
        ContactPhone: contactPhone,
      });

      setClaimSuccess('Klaim kepemilikan berhasil diajukan! Anda dapat memantau statusnya di dashboard.');
      setTimeout(() => {
        setShowClaimModal(false);
        fetchReport();
      }, 2000);
    } catch (err: any) {
      setClaimError(err.response?.data?.Message || 'Gagal mengajukan klaim. Pastikan semua data terisi.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  const handleMarkFound = async () => {
    if (!window.confirm('Apakah barang ini sudah benar-benar Anda temukan kembali? Status laporan akan diubah menjadi MATCHED.')) {
      return;
    }

    setMarkingFound(true);
    try {
      await api.post(`/reports/${id}/mark-found`);
      alert('Laporan berhasil ditandai sebagai sudah ditemukan!');
      fetchReport();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal mengubah status laporan.');
    } finally {
      setMarkingFound(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Memuat rincian laporan...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Laporan Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Laporan mungkin belum diverifikasi atau telah dihapus.'}</p>
        <Link
          to="/reports"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm"
        >
          <ArrowLeft size={16} /> Kembali ke Cari Laporan
        </Link>
      </div>
    );
  }

  const isOwner = user && user.Id === report.ReporterId;
  const canClaim = user && !isOwner && report.Type === 'FOUND' && report.Status === 'OPEN';
  const canMarkFound = isOwner && report.Type === 'LOST' && report.Status === 'OPEN';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <Link
        to="/reports"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition"
      >
        <ArrowLeft size={16} /> Kembali ke Daftar Laporan
      </Link>

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-0">
        {/* Images Carousel / Gallery */}
        <div className="md:col-span-5 bg-gray-50 p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
          <div>
            {report.Images && report.Images.length > 0 ? (
              <div className="space-y-4">
                <div className="w-full h-72 rounded-2xl overflow-hidden bg-gray-200 shadow-inner">
                  <img
                    src={report.Images[0].FilePath}
                    alt={report.Title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {report.Images.length > 1 && (
                  <div className="flex gap-2">
                    {report.Images.map((img) => (
                      <div key={img.Id} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200">
                        <img src={img.FilePath} alt="thumbnail" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-72 rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                <Tag size={48} className="mb-2 opacity-50" />
                <span className="text-xs font-semibold">Tidak ada foto dilampirkan</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200/60 text-xs text-gray-400 space-y-1">
            <p>ID Laporan: <span className="font-mono text-gray-600">{report.Id.slice(0, 8)}</span></p>
            <p>Dibuat pada: {new Date(report.CreatedAt).toLocaleString('id-ID')}</p>
            {report.VerifiedAt && (
              <p className="text-emerald-600 font-semibold">
                Terverifikasi Petugas: {new Date(report.VerifiedAt).toLocaleDateString('id-ID')}
              </p>
            )}
          </div>
        </div>

        {/* Detailed Information Content */}
        <div className="md:col-span-7 p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <TypeBadge type={report.Type} />
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{report.CategoryName}</span>
              </div>
              <StatusBadge status={report.Status} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-4">
              {report.Title}
            </h1>

            {/* Quick Specs table */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl text-xs text-gray-600 mb-6">
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">MEREK / BRAND</span>
                <span className="font-semibold text-gray-800">{report.Brand || '-'}</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">WARNA</span>
                <span className="font-semibold text-gray-800">{report.Color || '-'}</span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">LOKASI</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-600 shrink-0" />
                  {report.Location}
                </span>
              </div>
              <div>
                <span className="font-bold text-gray-400 block mb-0.5">TANGGAL KEJADIAN</span>
                <span className="font-semibold text-gray-800 flex items-center gap-1">
                  <Calendar size={12} className="text-emerald-600 shrink-0" />
                  {new Date(report.EventAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deskripsi Lengkap</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-gray-100">
                {report.Description}
              </p>
            </div>

            {/* Reporter Masked Identity as per requirement */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <User size={16} />
              </div>
              <div>
                <span className="font-semibold text-gray-800 block">Dilaporkan oleh: {report.ReporterName}</span>
                <span className="text-[11px] text-gray-400">Identitas terlindungi demi keamanan kampus</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
            {canClaim && (
              <button
                onClick={() => setShowClaimModal(true)}
                className="flex-1 py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                <HandMetal size={18} /> Ajukan Klaim Kepemilikan
              </button>
            )}

            {canMarkFound && (
              <button
                onClick={handleMarkFound}
                disabled={markingFound}
                className="flex-1 py-3.5 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 transition"
              >
                <CheckCircle size={18} /> Tandai Sudah Ditemukan
              </button>
            )}

            {!user && report.Type === 'FOUND' && report.Status === 'OPEN' && (
              <Link
                to="/login"
                className="flex-1 py-3.5 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-sm text-center transition"
              >
                Masuk untuk Mengajukan Klaim
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Similar Reports Section as per requirement 4 */}
      {report.SimilarReports && report.SimilarReports.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-600" />
            <h2 className="text-xl font-extrabold text-gray-900">
              Laporan Serupa Terkait ({report.CategoryName})
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            Berikut adalah laporan dengan kategori yang sama yang mungkin berhubungan:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {report.SimilarReports.map((sim) => (
              <Link
                key={sim.Id}
                to={`/reports/${sim.Id}`}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <TypeBadge type={sim.Type} size="sm" />
                    <StatusBadge status={sim.Status} size="sm" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{sim.Title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{sim.Location}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-50 text-[11px] text-gray-400">
                  {new Date(sim.EventAt).toLocaleDateString('id-ID')}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Claim Submission Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative">
            <h2 className="text-2xl font-black text-gray-900 mb-2">Ajukan Klaim Kepemilikan</h2>
            <p className="text-xs text-gray-500 mb-6">
              Berikan rincian bukti bahwa barang temuan <span className="font-bold text-gray-800">"{report.Title}"</span> benar-benar milik Anda.
            </p>

            {claimError && (
              <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-3 rounded-r-xl text-xs text-rose-700">
                {claimError}
              </div>
            )}

            {claimSuccess && (
              <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-r-xl text-xs text-emerald-800 font-bold">
                {claimSuccess}
              </div>
            )}

            <form onSubmit={handleClaimSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Bukti Kepemilikan (Ciri Khusus / Tanda Pengenal) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={proofAnswer}
                  onChange={(e) => setProofAnswer(e.target.value)}
                  placeholder="Contoh: Ada stiker kucing di pojok kanan, terdapat goresan kecil di bagian belakang, atau wallpaper HP foto pemandangan..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Kronologi Kehilangan Anda *
                </label>
                <textarea
                  required
                  rows={2}
                  value={ownershipDescription}
                  onChange={(e) => setOwnershipDescription(e.target.value)}
                  placeholder="Contoh: Barang tertinggal saat praktikum jam 10 pagi di lab..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nomor WhatsApp / HP yang Dapat Dihubungi Petugas *
                </label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full p-3 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 py-3 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingClaim}
                  className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md"
                >
                  {submittingClaim ? 'Mengirim...' : 'Kirim Pengajuan Klaim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
