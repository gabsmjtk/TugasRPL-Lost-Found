import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  PackageOpen
} from 'lucide-react';
import api from '../services/api';
import { Category } from '@campusfind/shared';

export default function CreateReport() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') || 'LOST').toUpperCase() as 'LOST' | 'FOUND';

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form states
  const [type, setType] = useState<'LOST' | 'FOUND'>(initialType);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [location, setLocation] = useState('');
  const [eventAt, setEventAt] = useState(new Date().toISOString().slice(0, 16));
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        setCategories(res.data);
        if (res.data.length > 0 && !categoryId) {
          setCategoryId(res.data[0].Id);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3);
      setFiles(selectedFiles);

      // Create object URLs for previews
      const previews = selectedFiles.map((file) => URL.createObjectURL(file));
      setFilePreviews(previews);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (description.trim().length < 20) {
      setError('Deskripsi harus memiliki panjang minimal 20 karakter.');
      return;
    }

    if (!categoryId) {
      setError('Pilih kategori barang.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('Type', type);
      formData.append('Title', title);
      formData.append('CategoryId', categoryId);
      if (brand) formData.append('Brand', brand);
      if (color) formData.append('Color', color);
      formData.append('Location', location);
      formData.append('EventAt', new Date(eventAt).toISOString());
      formData.append('Description', description);

      files.forEach((file) => {
        formData.append('images', file);
      });

      await api.post('/reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.Message || 'Gagal menyimpan laporan. Pastikan data terisi dengan benar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-6 transition"
      >
        <ArrowLeft size={16} /> Kembali ke Dashboard
      </Link>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white">
          <h1 className="text-2xl sm:text-3xl font-black">Buat Laporan Barang</h1>
          <p className="text-emerald-100 text-sm mt-1">
            Isi formulir dengan lengkap agar petugas dapat segera memverifikasi laporan Anda.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
              <div className="text-sm text-rose-700 font-medium">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-xl flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              <div className="text-sm text-emerald-800 font-bold">
                Laporan berhasil dibuat! Menunggu verifikasi admin. Mengalihkan ke dashboard...
              </div>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Jenis Laporan *</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('LOST')}
                className={`py-4 px-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold text-sm transition-all ${
                  type === 'LOST'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <HelpCircle size={20} className={type === 'LOST' ? 'text-rose-600' : 'text-gray-400'} />
                Barang Hilang
              </button>

              <button
                type="button"
                onClick={() => setType('FOUND')}
                className={`py-4 px-4 rounded-2xl border-2 flex items-center justify-center gap-2.5 font-bold text-sm transition-all ${
                  type === 'FOUND'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <PackageOpen size={20} className={type === 'FOUND' ? 'text-emerald-600' : 'text-gray-400'} />
                Barang Ditemukan
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Nama Barang / Judul Laporan *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Dompet Kulit Cokelat, Kunci Motor Honda Beat"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Category, Brand, Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Kategori *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c) => (
                  <option key={c.Id} value={c.Id}>
                    {c.Name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Merek / Brand (Opsional)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Contoh: Asus, Apple, Eiger"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Warna (Opsional)</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Contoh: Hitam, Biru Dongker"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Location and Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Lokasi Kejadian / Ditemukan *</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Depan Lab Komputer Lantai 2, Kantin Utama"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Waktu & Tanggal Kejadian *</label>
              <input
                type="datetime-local"
                required
                value={eventAt}
                onChange={(e) => setEventAt(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-700 uppercase">Deskripsi Rinci *</label>
              <span className={`text-xs ${description.length < 20 ? 'text-rose-500 font-semibold' : 'text-gray-400'}`}>
                {description.length}/1000 karakter (min. 20)
              </span>
            </div>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan ciri-ciri khusus barang, kronologi kehilangan/penemuan. Hindari mencantumkan kata sandi atau data perbankan rahasia."
              className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* File Upload (Up to 3 images) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
              Foto Barang (Opsional, Maksimal 3 foto, @5MB)
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-gray-50/50">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-xs text-gray-600 font-medium">Klik untuk memilih foto atau seret ke sini</p>
              <p className="text-[11px] text-gray-400 mt-1">Format didukung: JPG, PNG, WEBP</p>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-block mt-3 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm"
              >
                Pilih File
              </label>
            </div>

            {/* Previews */}
            {filePreviews.length > 0 && (
              <div className="flex gap-4 mt-4">
                {filePreviews.map((src, i) => (
                  <div key={i} className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden bg-gray-100">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading || description.length < 20}
              className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all"
            >
              {loading ? 'Menyimpan Laporan...' : 'Kirim Laporan untuk Verifikasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
