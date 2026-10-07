import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Layers, 
  Handshake, 
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { 
  AdminDashboardResponse, 
  Category
} from '@campusfind/shared';
import { StatusBadge, TypeBadge } from '../components/StatusBadge';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [allClaims, setAllClaims] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'REPORTS' | 'CLAIMS' | 'HANDOVERS' | 'CATEGORIES' | 'USERS'>('OVERVIEW');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Handover form state
  const [handoverModal, setHandoverModal] = useState<any | null>(null);
  const [recipientName, setRecipientName] = useState('');
  const [handoverLocation, setHandoverLocation] = useState('Pos Satpam Utama');
  const [handoverNote, setHandoverNote] = useState('');

  // Category form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const fetchAllAdminData = async () => {
    try {
      const [dashRes, reportsRes, claimsRes, catRes, userRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/reports'),
        api.get('/admin/claims'),
        api.get('/admin/categories'),
        api.get('/admin/users'),
      ]);
      setData(dashRes.data);
      setAllReports(reportsRes.data);
      setAllClaims(claimsRes.data);
      setCategories(catRes.data);
      setUsers(userRes.data);
    } catch (err) {
      console.error('Failed to fetch admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // 1. Verify Report (OPEN or REJECTED)
  const handleVerifyReport = async (reportId: string, status: 'OPEN' | 'REJECTED') => {
    const note = prompt(`Masukkan catatan verifikasi (opsional) untuk status ${status}:`) || undefined;
    setActionLoading(true);
    try {
      await api.patch(`/admin/reports/${reportId}/verify`, {
        Status: status,
        ModeratorNote: note
      });
      alert(`Laporan berhasil diubah ke status: ${status}`);
      fetchAllAdminData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal memverifikasi laporan');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Change Report Status (ARCHIVED, RETURNED, etc.)
  const handleChangeReportStatus = async (reportId: string, nextStatus: string) => {
    const note = prompt(`Masukkan alasan pengubahan status ke ${nextStatus}:`) || undefined;
    setActionLoading(true);
    try {
      await api.patch(`/admin/reports/${reportId}/status`, {
        Status: nextStatus,
        ModeratorNote: note
      });
      alert(`Status laporan berhasil diubah ke ${nextStatus}`);
      fetchAllAdminData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal mengubah status');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Decide Claim (APPROVED or REJECTED)
  const handleDecideClaim = async (claimId: string, status: 'APPROVED' | 'REJECTED') => {
    const note = prompt(`Wajib masukkan catatan keputusan (${status}):`);
    if (!note) {
      alert('Catatan keputusan harus diisi.');
      return;
    }

    setActionLoading(true);
    try {
      await api.patch(`/admin/claims/${claimId}/decision`, {
        Status: status,
        DecisionNote: note
      });
      alert(`Klaim berhasil di-${status.toLowerCase()}`);
      fetchAllAdminData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal memproses klaim');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Record Handover
  const handleRecordHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverModal) return;

    setActionLoading(true);
    try {
      await api.post('/admin/handovers', {
        ReportId: handoverModal.ReportId,
        ClaimId: handoverModal.Id,
        RecipientName: recipientName,
        HandoverLocation: handoverLocation,
        Note: handoverNote
      });
      alert('Serah terima barang berhasil dicatat! Status laporan menjadi RETURNED.');
      setHandoverModal(null);
      fetchAllAdminData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal mencatat serah terima.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      await api.post('/admin/categories', {
        Name: newCatName.trim(),
        Description: newCatDesc.trim() || undefined
      });
      setNewCatName('');
      setNewCatDesc('');
      alert('Kategori berhasil ditambahkan!');
      fetchAllAdminData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal membuat kategori');
    }
  };

  // 6. Toggle Category Active
  const handleToggleCategory = async (catId: string, currentActive: boolean) => {
    try {
      await api.patch(`/admin/categories/${catId}/active`, {
        IsActive: !currentActive
      });
      fetchAllAdminData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal mengubah status kategori');
    }
  };

  // 7. Toggle User Active
  const handleToggleUser = async (userId: string, currentActive: boolean) => {
    if (!window.confirm(`Yakin ingin ${currentActive ? 'menonaktifkan' : 'mengaktifkan'} pengguna ini?`)) return;
    try {
      await api.patch(`/admin/users/${userId}/active`, {
        IsActive: !currentActive
      });
      fetchAllAdminData();
    } catch (err: any) {
      alert(err.response?.data?.Message || 'Gagal mengubah status pengguna');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Memuat dashboard pengelola kampus...</p>
      </div>
    );
  }

  const approvedClaims = allClaims.filter(c => c.Status === 'APPROVED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Header */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck size={16} /> Portal Petugas & Admin Kampus
          </div>
          <h1 className="text-3xl font-black">Panel Manajemen CampusFind</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Verifikasi laporan mahasiswa, proses klaim barang temuan, catat serah terima resmi, dan kelola master data.
          </p>
        </div>
      </div>

      {/* Metric Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={24} /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Menunggu Verifikasi</p>
              <p className="text-2xl font-black text-gray-900">{data.Summary.PendingReportsCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Layers size={24} /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Laporan Terbuka</p>
              <p className="text-2xl font-black text-gray-900">{data.Summary.OpenReportsCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><AlertCircle size={24} /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Klaim Menunggu Review</p>
              <p className="text-2xl font-black text-gray-900">{data.Summary.PendingClaimsCount}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Handshake size={24} /></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Selesai Dikembalikan</p>
              <p className="text-2xl font-black text-gray-900">{data.Summary.ReturnedItemsCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 flex flex-wrap px-6 pt-3 gap-2 bg-gray-50/50">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'OVERVIEW' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Antrean Prioritas
          </button>
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'REPORTS' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Semua Laporan ({allReports.length})
          </button>
          <button
            onClick={() => setActiveTab('CLAIMS')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'CLAIMS' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Semua Klaim ({allClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('HANDOVERS')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'HANDOVERS' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Catat Serah Terima ({approvedClaims.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'CATEGORIES' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Kategori ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`py-3 px-3 font-bold text-xs sm:text-sm border-b-2 transition ${
              activeTab === 'USERS' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Pengguna ({users.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PENDING QUEUE */}
        {activeTab === 'OVERVIEW' && (
          <div className="p-6 space-y-8">
            {/* Pending Reports Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  <Clock size={20} className="text-amber-500" />
                  Laporan Menunggu Verifikasi ({data?.PendingReports.length || 0})
                </h3>
              </div>

              {data?.PendingReports.length === 0 ? (
                <div className="p-8 bg-gray-50 rounded-2xl text-center text-xs text-gray-500">
                  Tidak ada laporan yang menunggu verifikasi saat ini.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                      <tr>
                        <th className="p-3.5">Judul Laporan</th>
                        <th className="p-3.5">Jenis</th>
                        <th className="p-3.5">Kategori</th>
                        <th className="p-3.5">Lokasi</th>
                        <th className="p-3.5">Tanggal</th>
                        <th className="p-3.5 text-right">Aksi Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {data?.PendingReports.map((r) => (
                        <tr key={r.Id} className="hover:bg-gray-50/80">
                          <td className="p-3.5 font-bold text-gray-900">{r.Title}</td>
                          <td className="p-3.5"><TypeBadge type={r.Type} size="sm" /></td>
                          <td className="p-3.5">{r.CategoryName}</td>
                          <td className="p-3.5">{r.Location}</td>
                          <td className="p-3.5 text-gray-400">{new Date(r.EventAt).toLocaleDateString('id-ID')}</td>
                          <td className="p-3.5 text-right space-x-2">
                            <button
                              onClick={() => handleVerifyReport(r.Id, 'OPEN')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                            >
                              Setujui (OPEN)
                            </button>
                            <button
                              onClick={() => handleVerifyReport(r.Id, 'REJECTED')}
                              disabled={actionLoading}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg"
                            >
                              Tolak
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending Claims Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                  <AlertCircle size={20} className="text-purple-500" />
                  Klaim Kepemilikan Menunggu Putusan ({data?.PendingClaims.length || 0})
                </h3>
              </div>

              {data?.PendingClaims.length === 0 ? (
                <div className="p-8 bg-gray-50 rounded-2xl text-center text-xs text-gray-500">
                  Tidak ada klaim kepemilikan yang perlu diputuskan saat ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.PendingClaims.map((c) => (
                    <div key={c.Id} className="p-4 border border-gray-100 rounded-2xl bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{c.ReportTitle}</span>
                          <span className="text-xs text-gray-400">• Pengaju: <strong className="text-gray-700">{c.ClaimantName}</strong> ({c.ContactPhone})</span>
                        </div>
                        <p className="text-xs text-gray-600"><strong className="text-gray-700">Bukti:</strong> {c.ProofAnswer}</p>
                        <p className="text-xs text-gray-500"><strong className="text-gray-700">Kronologi:</strong> {c.OwnershipDescription}</p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleDecideClaim(c.Id, 'APPROVED')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm"
                        >
                          Setujui Klaim
                        </button>
                        <button
                          onClick={() => handleDecideClaim(c.Id, 'REJECTED')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ALL REPORTS */}
        {activeTab === 'REPORTS' && (
          <div className="p-6">
            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3.5">Judul</th>
                    <th className="p-3.5">Jenis</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Pelapor</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Aksi Kelola</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {allReports.map((r) => (
                    <tr key={r.Id} className="hover:bg-gray-50">
                      <td className="p-3.5 font-bold text-gray-900">{r.Title}</td>
                      <td className="p-3.5"><TypeBadge type={r.Type} size="sm" /></td>
                      <td className="p-3.5">{r.Category?.Name || '-'}</td>
                      <td className="p-3.5">{r.Reporter?.Name || '-'}</td>
                      <td className="p-3.5"><StatusBadge status={r.Status} size="sm" /></td>
                      <td className="p-3.5 space-x-1.5">
                        {r.Status === 'PENDING' && (
                          <button
                            onClick={() => handleVerifyReport(r.Id, 'OPEN')}
                            className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px]"
                          >
                            Verifikasi
                          </button>
                        )}
                        {r.Status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleChangeReportStatus(r.Id, 'ARCHIVED')}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-[11px]"
                          >
                            Arsipkan
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ALL CLAIMS */}
        {activeTab === 'CLAIMS' && (
          <div className="p-6">
            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3.5">Barang</th>
                    <th className="p-3.5">Pengaju</th>
                    <th className="p-3.5">Bukti Jawaban</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Catatan Keputusan</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {allClaims.map((c) => (
                    <tr key={c.Id} className="hover:bg-gray-50">
                      <td className="p-3.5 font-bold text-gray-900">{c.Report?.Title || '-'}</td>
                      <td className="p-3.5">{c.Claimant?.Name || '-'} ({c.ContactPhone})</td>
                      <td className="p-3.5 max-w-xs truncate">{c.ProofAnswer}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          c.Status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          c.Status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                          c.Status === 'COMPLETED' ? 'bg-teal-100 text-teal-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {c.Status}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500">{c.DecisionNote || '-'}</td>
                      <td className="p-3.5 text-right">
                        {c.Status === 'PENDING' && (
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleDecideClaim(c.Id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px]"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleDecideClaim(c.Id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-100 text-rose-700 font-bold rounded-lg text-[11px]"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: HANDOVERS */}
        {activeTab === 'HANDOVERS' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 text-base mb-1">Pencatatan Serah Terima Barang</h3>
              <p className="text-xs text-gray-500">
                Pilih klaim yang telah disetujui (APPROVED) untuk mencatat bukti penyerahan barang resmi kepada pemiliknya.
              </p>
            </div>

            {approvedClaims.length === 0 ? (
              <div className="p-8 bg-gray-50 rounded-2xl text-center text-xs text-gray-500">
                Belum ada klaim berstatus APPROVED yang siap diserahterimakan.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedClaims.map((claim) => (
                  <div key={claim.Id} className="p-5 border border-gray-100 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-gray-900 text-base">{claim.Report?.Title}</h4>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">Siap Diserahkan</span>
                      </div>
                      <p className="text-xs text-gray-600">Penerima: <strong className="text-gray-800">{claim.Claimant?.Name}</strong></p>
                      <p className="text-xs text-gray-500">No. HP: {claim.ContactPhone}</p>
                    </div>

                    <button
                      onClick={() => {
                        setHandoverModal(claim);
                        setRecipientName(claim.Claimant?.Name || '');
                      }}
                      className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
                    >
                      Catat Penyerahan Barang
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CATEGORIES */}
        {activeTab === 'CATEGORIES' && (
          <div className="p-6 space-y-8">
            {/* Create Category */}
            <form onSubmit={handleCreateCategory} className="p-5 bg-gray-50 rounded-2xl border border-gray-200/60 max-w-xl space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">Tambah Kategori Baru</h4>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nama Kategori (contoh: Pakaian, Kunci)"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Deskripsi singkat (opsional)"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow-sm hover:bg-emerald-700 transition"
              >
                Simpan Kategori
              </button>
            </form>

            {/* Category list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <div key={cat.Id} className="p-4 border border-gray-100 rounded-2xl bg-white shadow-sm flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">{cat.Name}</h5>
                    <span className={`text-[10px] font-bold ${cat.IsActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {cat.IsActive ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleCategory(cat.Id, cat.IsActive)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                      cat.IsActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {cat.IsActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: USERS */}
        {activeTab === 'USERS' && (
          <div className="p-6">
            <div className="overflow-x-auto border border-gray-100 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3.5">Nama Lengkap</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">NIM / NPK</th>
                    <th className="p-3.5">Peran</th>
                    <th className="p-3.5">Status Akun</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {users.map((u) => (
                    <tr key={u.Id} className="hover:bg-gray-50">
                      <td className="p-3.5 font-bold text-gray-900">{u.Name}</td>
                      <td className="p-3.5">{u.Email}</td>
                      <td className="p-3.5 font-mono">{u.StudentNumber || '-'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          u.Role === 'ADMIN' ? 'bg-slate-900 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.Role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`font-bold ${u.IsActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {u.IsActive ? 'Aktif' : 'Dibekukan'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleUser(u.Id, u.IsActive)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                            u.IsActive ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {u.IsActive ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Handover Modal Confirmation */}
      {handoverModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-1">Rekam Serah Terima Barang</h3>
            <p className="text-xs text-gray-500 mb-4">
              Barang: <span className="font-bold text-gray-800">{handoverModal.Report?.Title}</span>
            </p>

            <form onSubmit={handleRecordHandover} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Nama Penerima Barang *</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Lokasi Serah Terima *</label>
                <input
                  type="text"
                  required
                  value={handoverLocation}
                  onChange={(e) => setHandoverLocation(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Catatan Tambahan Petugas</label>
                <textarea
                  rows={2}
                  value={handoverNote}
                  onChange={(e) => setHandoverNote(e.target.value)}
                  placeholder="Kondisi barang saat diserahkan..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setHandoverModal(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  {actionLoading ? 'Menyimpan...' : 'Konfirmasi Selesai'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}