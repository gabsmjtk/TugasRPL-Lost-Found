import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import StatusBadge from '../components/StatusBadge';
import { ArrowLeft, Plus, Loader2, FileText, Calendar, MapPin, Tag } from 'lucide-react';

interface ReportSummaryItem {
  Id: string;
  Type: string;
  Status: string;
  Title: string;
  CategoryName: string;
  Location: string;
  EventAt: string;
  CreatedAt: string;
  ImageUrl?: string | null;
}

const MyReports: React.FC = () => {
  const [reports, setReports] = useState<ReportSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/me/reports')
      .then((res) => setReports(res.data))
      .catch(() => setError('Gagal memuat daftar laporan'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 mb-2 transition-colors"
          >
            <ArrowLeft size={16} /> Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Semua Laporan Saya</h1>
          <p className="text-sm text-gray-500">Kelola seluruh barang hilang dan temuan yang Anda laporkan.</p>
        </div>
        <Link
          to="/reports/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus size={16} /> Buat Laporan
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-emerald-500" size={36} />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700">
          <p>{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <FileText className="mx-auto text-gray-300 mb-3" size={48} />
          <h3 className="font-semibold text-gray-800 text-lg mb-1">Belum Ada Laporan</h3>
          <p className="text-sm text-gray-500 mb-6">Anda belum pernah membuat laporan kehilangan atau temuan.</p>
          <Link
            to="/reports/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Plus size={16} /> Buat Laporan Pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r) => (
            <div
              key={r.Id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              <div className="flex p-4 gap-4">
                {r.ImageUrl ? (
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={getImageUrl(r.ImageUrl)}
                      alt={r.Title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-300">
                    <FileText size={28} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        r.Type === 'LOST'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {r.Type === 'LOST' ? 'Hilang' : 'Ditemukan'}
                    </span>
                    <StatusBadge status={r.Status} size="sm" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-base line-clamp-1 mb-1">
                    {r.Title}
                  </h3>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Tag size={12} className="shrink-0" />
                      <span className="truncate">{r.CategoryName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{r.Location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="shrink-0" />
                      <span>{new Date(r.EventAt).toLocaleDateString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto px-4 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-2">
                {['PENDING', 'OPEN'].includes(r.Status) && (
                  <Link
                    to={`/reports/edit/${r.Id}`}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:text-emerald-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </Link>
                )}
                <Link
                  to={`/reports/${r.Id}`}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  Lihat Detail →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReports;
