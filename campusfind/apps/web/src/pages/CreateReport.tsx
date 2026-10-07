import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Upload, AlertTriangle, PackageCheck, Loader2, X, CheckCircle2 } from 'lucide-react';

interface Category { Id: string; Name: string; }

const CreateReport: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get('type') === 'found' ? 'FOUND' : 'LOST';

  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    Title: '', Type: defaultType, CategoryId: '', Brand: '', Color: '',
    Description: '', Location: '', EventAt: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 3 - images.length);
    const valid = files.filter(f => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return false;
      if (f.size > 5 * 1024 * 1024) return false;
      return true;
    });
    setImages(prev => [...prev, ...valid].slice(0, 3));
    setImagePreviews(prev => {
      const newPreviews = valid.map(f => URL.createObjectURL(f));
      return [...prev, ...newPreviews].slice(0, 3);
    });
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[i]);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      images.forEach(img => formData.append('images', img));

      const res = await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setTimeout(() => navigate(`/reports/${res.data.Id}`), 2000);
    } catch (err: any) {
      setError(err.response?.data?.Message || 'Gagal membuat laporan');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center px-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="text-green-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Laporan Terkirim!</h2>
        <p className="text-gray-500">Laporan Anda sedang menunggu verifikasi admin. Anda akan diarahkan ke halaman laporan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buat Laporan Baru</h1>
        <p className="text-gray-500 text-sm mt-1">Isi form di bawah ini untuk melaporkan barang hilang atau ditemukan</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 flex gap-2">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Laporan *</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'LOST', label: 'Barang Hilang', icon: AlertTriangle, color: 'border-red-300 bg-red-50 text-red-700' },
                { value: 'FOUND', label: 'Barang Ditemukan', icon: PackageCheck, color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
              ].map(({ value, label, icon: Icon, color }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.Type === value ? color : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <input type="radio" name="Type" value={value} checked={form.Type === value} onChange={handleChange} className="sr-only" />
                  <Icon size={18} />
                  <span className="font-medium text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul / Nama Barang *</label>
            <input
              type="text" name="Title" required value={form.Title} onChange={handleChange}
              placeholder="cth. Dompet kulit coklat"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
            <select
              name="CategoryId" required value={form.CategoryId} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white"
            >
              <option value="">Pilih kategori...</option>
              {categories.map(c => <option key={c.Id} value={c.Id}>{c.Name}</option>)}
            </select>
          </div>

          {/* Brand & Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merek (opsional)</label>
              <input
                type="text" name="Brand" value={form.Brand} onChange={handleChange}
                placeholder="cth. Samsung"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warna (opsional)</label>
              <input
                type="text" name="Color" value={form.Color} onChange={handleChange}
                placeholder="cth. Hitam"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi * (20–1000 karakter)</label>
            <textarea
              name="Description" required value={form.Description} onChange={handleChange}
              placeholder="Deskripsikan barang secara detail. JANGAN cantumkan informasi pribadi sensitif."
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 resize-none"
              minLength={20} maxLength={1000}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">{form.Description.length}/1000</div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi *</label>
            <input
              type="text" name="Location" required value={form.Location} onChange={handleChange}
              placeholder="cth. Gedung A Lantai 2, Perpustakaan"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Event date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu Kejadian *</label>
            <input
              type="datetime-local" name="EventAt" required value={form.EventAt} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto Barang (maks. 3)</label>
            <div className="flex flex-wrap gap-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-xs text-gray-400 mt-1">Tambah</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImageChange} className="sr-only" />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Format: JPEG, PNG, WebP · Maks. 5 MB per foto</p>
          </div>

          {/* Privacy warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Jangan cantumkan nomor KTP, PIN, kata sandi, atau informasi sensitif lainnya dalam deskripsi.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {loading ? <><Loader2 size={16} className="animate-spin" /> Mengirim...</> : 'Kirim Laporan'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateReport;
