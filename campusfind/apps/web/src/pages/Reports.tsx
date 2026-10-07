import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Inbox, 
  RefreshCw, 
  PlusCircle 
} from 'lucide-react';
import api from '../services/api';
import { ReportSummary, Category } from '@campusfind/shared';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filter States
  const search = searchParams.get('Search') || '';
  const type = searchParams.get('Type') || '';
  const categoryId = searchParams.get('CategoryId') || '';
  const location = searchParams.get('Location') || '';
  const status = searchParams.get('Status') || '';
  const sort = searchParams.get('Sort') || 'newest';
  const page = parseInt(searchParams.get('Page') || '1', 10);

  // Load Categories once
  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch reports on filter change
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.set('Search', search);
        if (type) queryParams.set('Type', type);
        if (categoryId) queryParams.set('CategoryId', categoryId);
        if (location) queryParams.set('Location', location);
        if (status) queryParams.set('Status', status);
        queryParams.set('Sort', sort);
        queryParams.set('Page', page.toString());
        queryParams.set('PageSize', '9');

        const res = await api.get(`/reports?${queryParams.toString()}`);
        setReports(res.data.Data || []);
        setTotalPages(res.data.TotalPages || 1);
        setTotalCount(res.data.Total || 0);
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [search, type, categoryId, location, status, sort, page]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // reset to page 1 on filter modification
    if (key !== 'Page') {
      next.set('Page', '1');
    }
    setSearchParams(next);
  };

  const handleResetFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cari Laporan Barang</h1>
          <p className="text-gray-500 text-sm mt-1">
            Telusuri barang yang dilaporkan hilang atau ditemukan di seluruh area kampus.
          </p>
        </div>

        <Link
          to="/reports/create"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition-all hover:shadow-lg"
        >
          <PlusCircle size={18} /> Buat Laporan Baru
        </Link>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        {/* Search bar & Type Toggle */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => updateParam('Search', e.target.value)}
              placeholder="Cari kata kunci (nama barang, deskripsi, lokasi)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="md:col-span-4 flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => updateParam('Type', '')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                !type ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Semua Jenis
            </button>
            <button
              onClick={() => updateParam('Type', 'LOST')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'LOST' ? 'bg-rose-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Hilang
            </button>
            <button
              onClick={() => updateParam('Type', 'FOUND')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                type === 'FOUND' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Ditemukan
            </button>
          </div>
        </div>

        {/* Detailed Filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Kategori</label>
            <select
              value={categoryId}
              onChange={(e) => updateParam('CategoryId', e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.Id} value={cat.Id}>
                  {cat.Name}
                </option>
              ))}
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Lokasi</label>
            <input
              type="text"
              value={location}
              onChange={(e) => updateParam('Location', e.target.value)}
              placeholder="Contoh: Gedung A, Kantin"
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Status</label>
            <select
              value={status}
              onChange={(e) => updateParam('Status', e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Semua Status Terverifikasi</option>
              <option value="OPEN">Terbuka (OPEN)</option>
              <option value="MATCHED">Ditemukan (MATCHED)</option>
              <option value="CLAIMED">Diklaim (CLAIMED)</option>
              <option value="RETURNED">Dikembalikan (RETURNED)</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Urutan</label>
            <select
              value={sort}
              onChange={(e) => updateParam('Sort', e.target.value)}
              className="w-full py-2 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
            </select>
          </div>
        </div>

        {/* Active Filters count & reset button */}
        {(search || type || categoryId || location || status) && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-500">Filter aktif diterapkan</span>
            <button
              onClick={handleResetFilters}
              className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
            >
              <RefreshCw size={12} /> Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Reports Results Feed */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-semibold text-gray-500">
            Ditemukan <span className="text-gray-900 font-bold">{totalCount}</span> laporan
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
            <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-800">Tidak ada laporan yang sesuai</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
              Coba sesuaikan kata kunci pencarian atau bersihkan filter untuk melihat laporan lainnya.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-5 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
            >
              Reset Semua Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
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

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-8">
            <button
              onClick={() => updateParam('Page', (page - 1).toString())}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-600 px-4">
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => updateParam('Page', (page + 1).toString())}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
