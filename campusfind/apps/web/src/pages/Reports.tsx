import React, { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { Search, MapPin, Filter, X, ChevronLeft, ChevronRight, Loader2, FileText, AlertCircle } from 'lucide-react';

interface Category { Id: string; Name: string; }
interface Report {
  Id: string; Type: string; Status: string; Title: string;
  CategoryName: string; Location: string; EventAt: string;
  CreatedAt: string; ImageUrl?: string; ReporterName: string;
}
interface Paginated { Data: Report[]; Total: number; Page: number; PageSize: number; TotalPages: number; }

const Reports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<Paginated | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const search = searchParams.get('Search') || '';
  const type = searchParams.get('Type') || '';
  const categoryId = searchParams.get('CategoryId') || '';
  const status = searchParams.get('Status') || '';
  const sort = searchParams.get('Sort') || 'newest';
  const page = parseInt(searchParams.get('Page') || '1');

  const [searchInput, setSearchInput] = useState(search);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('Search', search);
      if (type) params.set('Type', type);
      if (categoryId) params.set('CategoryId', categoryId);
      if (status) params.set('Status', status);
      params.set('Sort', sort);
      params.set('Page', String(page));
      params.set('PageSize', '9');

      const res = await api.get(`/reports?${params.toString()}`);
      setReports(res.data);
    } catch (e: any) {
      setError('Gagal memuat laporan. Pastikan server API berjalan.');
    } finally {
      setLoading(false);
    }
  }, [search, type, categoryId, status, sort, page]);

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    fetchReports();
  }, [fetchReports]);

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('Page');
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter('Search', searchInput);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasFilters = search || type || categoryId || status;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Daftar Laporan</h1>
        <p className="text-gray-500 text-sm mt-1">
          {reports ? `${reports.Total} laporan ditemukan` : 'Memuat...'}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari judul, deskripsi, lokasi..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-transparent"
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            Cari
          </button>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="px-3 py-2.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus filter">
              <X size={16} />
            </button>
          )}
        </form>

        <div className="flex flex-wrap gap-2">
          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => setFilter('Type', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          >
            <option value="">Semua Tipe</option>
            <option value="LOST">Barang Hilang</option>
            <option value="FOUND">Barang Ditemukan</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryId}
            onChange={(e) => setFilter('CategoryId', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          >
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c.Id} value={c.Id}>{c.Name}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setFilter('Sort', e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertCircle className="text-red-400 mb-3" size={40} />
          <p className="text-red-600 font-medium">{error}</p>
          <button onClick={fetchReports} className="mt-4 px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
            Coba Lagi
          </button>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={36} />
        </div>
      ) : reports?.Data.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <FileText className="text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 font-medium text-lg">Tidak ada laporan ditemukan</p>
          <p className="text-gray-400 text-sm mt-1">Coba ubah kata kunci atau filter pencarian</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 text-sm text-emerald-600 hover:underline">
              Hapus semua filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports?.Data.map((r) => (
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
                  <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <FileText className="text-gray-300" size={40} />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex gap-1.5 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.Type === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {r.Type === 'LOST' ? 'Hilang' : 'Ditemukan'}
                    </span>
                    <StatusBadge status={r.Status} size="sm" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">{r.Title}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 line-clamp-1">
                    <MapPin size={11} /> {r.Location}
                  </p>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                    <span>{r.CategoryName}</span>
                    <span>{new Date(r.EventAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {reports && reports.TotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setFilter('Page', String(page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-600 px-3">
                Halaman {page} dari {reports.TotalPages}
              </span>
              <button
                onClick={() => setFilter('Page', String(page + 1))}
                disabled={page >= reports.TotalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
