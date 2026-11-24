import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Loader2, AlertCircle, Save } from 'lucide-react';

interface Category {
  Id: string;
  Name: string;
}

const EditReport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    Title: '',
    CategoryId: '',
    Brand: '',
    Color: '',
    Description: '',
    Location: '',
    EventAt: '',
  });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');

    Promise.all([
      api.get('/categories'),
      api.get(`/reports/${id}`),
    ])
      .then(([catRes, repRes]) => {
        setCategories(catRes.data);
        const report = repRes.data;

        if (user && report.ReporterId !== user.Id) {
          setError('Anda tidak memiliki izin untuk mengedit laporan ini.');
          return;
        }

        if (!['PENDING', 'OPEN'].includes(report.Status)) {
          setError('Laporan tidak dapat diedit pada status ini.');
          return;
        }

        const formattedDate = report.EventAt
          ? new Date(report.EventAt).toISOString().slice(0, 16)
          : '';

        setForm({
          Title: report.Title || '',
          CategoryId: report.CategoryId || '',
          Brand: report.Brand || '',
          Color: report.Color || '',
          Description: report.Description || '',
          Location: report.Location || '',
          EventAt: formattedDate,
        });
      })
      .catch((err) => {
        setError(err.response?.data?.Message || 'Gagal memuat data laporan');
      })
      .finally(() => setLoading(false));
  }, [id, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setError('');

    try {
      await api.put(`/reports/${id}`, {
        ...form,
        EventAt: form.EventAt ? new Date(form.EventAt).toISOString() : undefined,
      });
      navigate(`/reports/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.Message || 'Gagal memperbarui laporan');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-emerald-500" size={36} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to={`/reports/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Detail Laporan
      </Link>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Edit Laporan</h1>
        <p className="text-sm text-gray-500 mb-6">Perbarui informasi laporan barang Anda.</p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Laporan *</label>
            <input
              type="text"
              name="Title"
              required
              value={form.Title}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            <select
              name="CategoryId"
              required
              value={form.CategoryId}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            >
              <option value="">Pilih Kategori</option>
              {categories.map((c) => (
                <option key={c.Id} value={c.Id}>
                  {c.Name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merek (Opsional)</label>
              <input
                type="text"
                name="Brand"
                value={form.Brand}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna (Opsional)</label>
              <input
                type="text"
                name="Color"
                value={form.Color}
                onChange={handleChange}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi *</label>
            <textarea
              name="Description"
              required
              rows={4}
              value={form.Description}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi Kejadian *</label>
            <input
              type="text"
              name="Location"
              required
              value={form.Location}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Kejadian *</label>
            <input
              type="datetime-local"
              name="EventAt"
              required
              value={form.EventAt}
              onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          <div className="pt-3 flex gap-3">
            <Link
              to={`/reports/${id}`}
              className="flex-1 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-center text-sm transition-colors"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditReport;
