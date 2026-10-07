import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/StatusBadge';
import {
  MapPin, Calendar, Tag, User, ArrowLeft, CheckCircle2,
  Loader2, AlertCircle, FileText, X, Phone, Send
} from 'lucide-react';

interface ReportDetail {
  Id: string; Type: string; Status: string; Title: string;
  CategoryName: string; Location: string; EventAt: string;
  CreatedAt: string; UpdatedAt: string; Description: string;
  Brand?: string | null; Color?: string | null; ModeratorNote?: string | null;
  ReporterName: string; ReporterId: string; VerifiedAt?: string | null;
  Images: Array<{ Id: string; FileName: string; MimeType: string; SortOrder: number; }>;
  SimilarReports: Array<{ Id: string; Title: string; Type: string; Status: string; Location: string; CategoryName: string; }>;
}

const ReportDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImg, setSelectedImg] = useState(0);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimData, setClaimData] = useState({ ProofAnswer: '', OwnershipDescription: '', ContactPhone: '' });
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [markingFound, setMarkingFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/reports/${id}`)
      .then(r => setReport(r.data))
      .catch(() => setError('Laporan tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setClaimLoading(true);
    setClaimError('');
    try {
      await api.post(`/reports/${id}/claims`, claimData);
      setClaimSuccess(true);
      setShowClaimForm(false);
    } catch (err: any) {
      setClaimError(err.response?.data?.Message || 'Gagal mengirim klaim');
    } finally {
      setClaimLoading(false);
    }
  };

  const handleMarkFound = async () => {
    if (!window.confirm('Tandai laporan ini sudah ditemukan?')) return;
    setMarkingFound(true);
    try {
      const res = await api.post(`/reports/${id}/mark-found`);
      setReport(prev => prev ? { ...prev, Status: res.data.Status } : prev);
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal memperbarui status');
    } finally {
      setMarkingFound(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-emerald-500" size={36} /></div>;
  if (error || !report) return (
    <div className="max-w-xl mx-auto py-24 text-center">
      <AlertCircle className="mx-auto mb-3 text-red-400" size={40} />
      <p className="text-red-600 font-medium">{error}</p>
      <Link to="/reports" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">← Kembali ke daftar laporan</Link>
    </div>
  );

  const isOwner = user?.Id === report.ReporterId;
  const canClaim = user && !isOwner && report.Type === 'FOUND' && report.Status === 'OPEN';
  const canMarkFound = isOwner && report.Type === 'LOST' && report.Status === 'OPEN';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/reports" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> Kembali ke Daftar Laporan
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Images */}
          {report.Images.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-100 relative">
                <img
                  src={`http://localhost:3001/uploads/${report.Images[selectedImg]?.FileName}`}
                  alt={report.Title}
                  className="w-full h-full object-contain"
                />
              </div>
              {report.Images.length > 1 && (
                <div className="flex gap-2 p-3">
                  {report.Images.map((img, i) => (
                    <button
                      key={img.Id}
                      onClick={() => setSelectedImg(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImg ? 'border-emerald-500' : 'border-transparent'}`}
                    >
                      <img src={`http://localhost:3001/uploads/${img.FileName}`} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-2xl h-48 flex items-center justify-center">
              <FileText className="text-gray-300" size={48} />
            </div>
          )}

          {/* Detail card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${report.Type === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {report.Type === 'LOST' ? '🔴 Barang Hilang' : '🟢 Barang Ditemukan'}
              </span>
              <StatusBadge status={report.Status} />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">{report.Title}</h1>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-start gap-2 text-sm">
                <Tag size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <div><div className="text-xs text-gray-400">Kategori</div><div className="font-medium text-gray-700">{report.CategoryName}</div></div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <div><div className="text-xs text-gray-400">Lokasi</div><div className="font-medium text-gray-700">{report.Location}</div></div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Calendar size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-gray-400">Tanggal Kejadian</div>
                  <div className="font-medium text-gray-700">{new Date(report.EventAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <User size={15} className="text-gray-400 mt-0.5 shrink-0" />
                <div><div className="text-xs text-gray-400">Dilaporkan oleh</div><div className="font-medium text-gray-700">{report.ReporterName}</div></div>
              </div>
              {report.Brand && (
                <div className="text-sm"><div className="text-xs text-gray-400">Merek</div><div className="font-medium text-gray-700">{report.Brand}</div></div>
              )}
              {report.Color && (
                <div className="text-sm"><div className="text-xs text-gray-400">Warna</div><div className="font-medium text-gray-700">{report.Color}</div></div>
              )}
            </div>

            <div>
              <div className="text-sm font-semibold text-gray-700 mb-2">Deskripsi</div>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{report.Description}</p>
            </div>

            {report.ModeratorNote && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="text-xs font-semibold text-blue-700 mb-1">Catatan Admin</div>
                <p className="text-sm text-blue-600">{report.ModeratorNote}</p>
              </div>
            )}

            <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
              Dibuat: {new Date(report.CreatedAt).toLocaleDateString('id-ID', { dateStyle: 'long' })} ·
              Diperbarui: {new Date(report.UpdatedAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Tindakan</h3>

            {claimSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3">
                <p className="text-sm text-green-700 font-medium">✅ Klaim berhasil dikirim! Admin akan meninjau klaim Anda.</p>
              </div>
            )}

            {canClaim && !claimSuccess && (
              <button
                onClick={() => { if (!user) { navigate('/login'); return; } setShowClaimForm(!showClaimForm); }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                <Send size={16} /> Ajukan Klaim Kepemilikan
              </button>
            )}

            {canMarkFound && (
              <button
                onClick={handleMarkFound}
                disabled={markingFound}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm mt-2 disabled:opacity-50"
              >
                {markingFound ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Tandai Sudah Ditemukan
              </button>
            )}

            {!user && (
              <p className="text-sm text-gray-500 text-center">
                <Link to="/login" className="text-emerald-600 font-semibold hover:underline">Masuk</Link> untuk mengajukan klaim atau tindakan lainnya.
              </p>
            )}

            {isOwner && (
              <div className="flex gap-2 mt-2">
                {['PENDING', 'OPEN'].includes(report.Status) && (
                  <Link to={`/reports/edit/${report.Id}`} className="flex-1 py-2.5 text-center text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    Edit
                  </Link>
                )}
                <span className="flex-1 py-2.5 text-center text-xs text-gray-400 border border-gray-100 rounded-xl">Laporan Anda</span>
              </div>
            )}
          </div>

          {/* Claim form */}
          {showClaimForm && (
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Form Klaim</h3>
                <button onClick={() => setShowClaimForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>
              {claimError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <p className="text-sm text-red-600">{claimError}</p>
                </div>
              )}
              <form onSubmit={handleClaim} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bukti Kepemilikan *</label>
                  <textarea
                    required
                    value={claimData.ProofAnswer}
                    onChange={e => setClaimData(p => ({ ...p, ProofAnswer: e.target.value }))}
                    placeholder="Jelaskan bukti bahwa barang ini milik Anda..."
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none h-24"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Deskripsi Kepemilikan *</label>
                  <textarea
                    required
                    value={claimData.OwnershipDescription}
                    onChange={e => setClaimData(p => ({ ...p, OwnershipDescription: e.target.value }))}
                    placeholder="Deskripsikan ciri khas barang Anda..."
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none h-20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nomor Telepon *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="tel"
                      required
                      value={claimData.ContactPhone}
                      onChange={e => setClaimData(p => ({ ...p, ContactPhone: e.target.value }))}
                      placeholder="08xx-xxxx-xxxx"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={claimLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {claimLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Kirim Klaim
                </button>
              </form>
            </div>
          )}

          {/* Similar reports */}
          {report.SimilarReports.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3">
                {report.Type === 'LOST' ? 'Temuan Serupa' : 'Laporan Hilang Serupa'}
              </h3>
              <div className="space-y-2">
                {report.SimilarReports.map(s => (
                  <Link
                    key={s.Id}
                    to={`/reports/${s.Id}`}
                    className="block p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all"
                  >
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{s.Title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin size={10} /> {s.Location}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
