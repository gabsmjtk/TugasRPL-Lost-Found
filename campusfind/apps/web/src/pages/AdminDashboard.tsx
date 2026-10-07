import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  LayoutDashboard, FileText, Send, Users, Tag, Loader2,
  AlertCircle, CheckCircle2, XCircle, Eye, ChevronRight,
  Shield, AlertTriangle, Package, RefreshCw, HandshakeIcon,
  ArrowRight, ChevronDown
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Report {
  Id: string; Type: string; Status: string; Title: string;
  CategoryName: string; Location: string; CreatedAt: string;
  ReporterName: string; ReporterEmail: string; ModeratorNote?: string;
  Description: string; Brand?: string; Color?: string;
}
interface Claim {
  Id: string; ReportTitle: string; ReportId: string; ClaimantName: string;
  ClaimantEmail: string; Status: string; ProofAnswer: string;
  OwnershipDescription: string; ContactPhone: string; DecisionNote?: string;
  CreatedAt: string;
}
interface DashboardData {
  PendingReports: Report[];
  PendingClaims: Claim[];
  Summary: {
    PendingReportsCount: number; OpenReportsCount: number;
    PendingClaimsCount: number; ReturnedItemsCount: number;
  };
}
interface Category { Id: string; Name: string; Description?: string; IsActive: boolean; }
interface User { Id: string; Name: string; Email: string; StudentNumber?: string; Role: string; IsActive: boolean; }

type Tab = 'dashboard' | 'reports' | 'claims' | 'handovers' | 'categories' | 'users';

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [reports, setReports] = useState<{ Data: Report[]; Total: number; TotalPages: number; } | null>(null);
  const [claims, setClaims] = useState<{ Data: Claim[]; Total: number; TotalPages: number; } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<{ Data: User[]; Total: number; } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modals state
  const [verifyModal, setVerifyModal] = useState<{ report: Report; } | null>(null);
  const [claimModal, setClaimModal] = useState<{ claim: Claim; } | null>(null);
  const [handoverModal, setHandoverModal] = useState<{ claim: Claim; } | null>(null);
  const [catModal, setCatModal] = useState<{ cat?: Category; } | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (!user || user.Role !== 'ADMIN') { navigate('/'); return; }
  }, [user, navigate]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/dashboard');
      setDashData(res.data);
    } catch { setError('Gagal memuat dashboard'); }
    finally { setLoading(false); }
  }, []);

  const fetchReports = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/reports?PageSize=20');
      setReports(res.data);
    } catch { setError('Gagal memuat laporan'); }
    finally { setLoading(false); }
  }, []);

  const fetchClaims = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/claims?PageSize=20');
      setClaims(res.data);
    } catch { setError('Gagal memuat klaim'); }
    finally { setLoading(false); }
  }, []);

  const fetchCategories = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/categories');
      setCategories(res.data);
    } catch { setError('Gagal memuat kategori'); }
    finally { setLoading(false); }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.get('/admin/users?PageSize=50');
      setUsers(res.data);
    } catch { setError('Gagal memuat pengguna'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') fetchDashboard();
    else if (tab === 'reports') fetchReports();
    else if (tab === 'claims') fetchClaims();
    else if (tab === 'categories') fetchCategories();
    else if (tab === 'users') fetchUsers();
  }, [tab, fetchDashboard, fetchReports, fetchClaims, fetchCategories, fetchUsers]);

  // ─── Verify report ─────────────────────────────────────────────────────────
  const [verifyForm, setVerifyForm] = useState({ Status: 'OPEN', ModeratorNote: '' });
  const submitVerify = async () => {
    if (!verifyModal) return;
    setModalLoading(true); setModalError('');
    try {
      await api.patch(`/admin/reports/${verifyModal.report.Id}/verify`, verifyForm);
      setVerifyModal(null);
      fetchDashboard(); if (tab === 'reports') fetchReports();
    } catch (e: any) { setModalError(e.response?.data?.Message || 'Gagal'); }
    finally { setModalLoading(false); }
  };

  // ─── Decide claim ──────────────────────────────────────────────────────────
  const [claimForm, setClaimForm] = useState({ Status: 'APPROVED', DecisionNote: '' });
  const submitClaim = async () => {
    if (!claimModal) return;
    setModalLoading(true); setModalError('');
    try {
      await api.patch(`/admin/claims/${claimModal.claim.Id}/decision`, claimForm);
      setClaimModal(null);
      fetchDashboard(); if (tab === 'claims') fetchClaims();
    } catch (e: any) { setModalError(e.response?.data?.Message || 'Gagal'); }
    finally { setModalLoading(false); }
  };

  // ─── Record handover ────────────────────────────────────────────────────────
  const [handoverForm, setHandoverForm] = useState({ RecipientName: '', HandoverLocation: '', Note: '' });
  const submitHandover = async () => {
    if (!handoverModal) return;
    setModalLoading(true); setModalError('');
    try {
      await api.post('/admin/handovers', {
        ReportId: handoverModal.claim.ReportId,
        ClaimId: handoverModal.claim.Id,
        ...handoverForm,
      });
      setHandoverModal(null);
      fetchDashboard(); if (tab === 'claims') fetchClaims();
    } catch (e: any) { setModalError(e.response?.data?.Message || 'Gagal'); }
    finally { setModalLoading(false); }
  };

  // ─── Category CRUD ─────────────────────────────────────────────────────────
  const [catForm, setCatForm] = useState({ Name: '', Description: '' });
  const submitCat = async () => {
    setModalLoading(true); setModalError('');
    try {
      if (catModal?.cat) {
        await api.put(`/admin/categories/${catModal.cat.Id}`, catForm);
      } else {
        await api.post('/admin/categories', catForm);
      }
      setCatModal(null); fetchCategories();
    } catch (e: any) { setModalError(e.response?.data?.Message || 'Gagal'); }
    finally { setModalLoading(false); }
  };

  const toggleCat = async (cat: Category) => {
    try {
      await api.patch(`/admin/categories/${cat.Id}/active`, { IsActive: !cat.IsActive });
      fetchCategories();
    } catch { alert('Gagal mengubah status kategori'); }
  };

  // ─── Toggle user active ────────────────────────────────────────────────────
  const toggleUser = async (u: User) => {
    if (!window.confirm(`${u.IsActive ? 'Nonaktifkan' : 'Aktifkan'} akun ${u.Name}?`)) return;
    try {
      await api.patch(`/admin/users/${u.Id}/active`, { IsActive: !u.IsActive });
      fetchUsers();
    } catch { alert('Gagal mengubah status pengguna'); }
  };

  const TABS: { key: Tab; label: string; icon: any }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'reports', label: 'Laporan', icon: FileText },
    { key: 'claims', label: 'Klaim', icon: Send },
    { key: 'categories', label: 'Kategori', icon: Tag },
    { key: 'users', label: 'Pengguna', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
          <Shield size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Panel Admin</h1>
          <p className="text-sm text-gray-500">CampusFind Management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex gap-2">
          <AlertCircle className="text-red-500 shrink-0" size={16} />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-purple-500" size={32} /></div>
      ) : (
        <>
          {/* ── DASHBOARD TAB ─────────────────────────────────────────────────── */}
          {tab === 'dashboard' && dashData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Laporan Pending', value: dashData.Summary.PendingReportsCount, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle },
                  { label: 'Laporan Aktif', value: dashData.Summary.OpenReportsCount, color: 'text-blue-600', bg: 'bg-blue-50', icon: Package },
                  { label: 'Klaim Pending', value: dashData.Summary.PendingClaimsCount, color: 'text-orange-600', bg: 'bg-orange-50', icon: Send },
                  { label: 'Barang Dikembalikan', value: dashData.Summary.ReturnedItemsCount, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
                ].map(({ label, value, color, bg, icon: Icon }) => (
                  <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                        <Icon className={color} size={20} />
                      </div>
                      <div>
                        <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
                        <div className="text-xs text-gray-500">{label}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending reports */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Laporan Menunggu Verifikasi</h2>
                  <button onClick={() => setTab('reports')} className="text-xs text-purple-600 hover:underline flex items-center gap-0.5">
                    Lihat semua <ChevronRight size={12} />
                  </button>
                </div>
                {dashData.PendingReports.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">Tidak ada laporan pending</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {dashData.PendingReports.map(r => (
                      <div key={r.Id} className="flex items-start gap-3 p-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${r.Type === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {r.Type === 'LOST' ? 'Hilang' : 'Temuan'}
                        </span>
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{r.Title}</p>
                          <p className="text-xs text-gray-500">{r.ReporterName} · {r.Location}</p>
                        </div>
                        <button
                          onClick={() => { setVerifyModal({ report: r }); setVerifyForm({ Status: 'OPEN', ModeratorNote: '' }); setModalError(''); }}
                          className="shrink-0 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                        >
                          Verifikasi
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending claims */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">Klaim Menunggu Keputusan</h2>
                  <button onClick={() => setTab('claims')} className="text-xs text-purple-600 hover:underline flex items-center gap-0.5">
                    Lihat semua <ChevronRight size={12} />
                  </button>
                </div>
                {dashData.PendingClaims.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">Tidak ada klaim pending</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {dashData.PendingClaims.map(c => (
                      <div key={c.Id} className="flex items-start gap-3 p-4">
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{c.ReportTitle}</p>
                          <p className="text-xs text-gray-500">{c.ClaimantName} · {new Date(c.CreatedAt).toLocaleDateString('id-ID')}</p>
                        </div>
                        <button
                          onClick={() => { setClaimModal({ claim: c }); setClaimForm({ Status: 'APPROVED', DecisionNote: '' }); setModalError(''); }}
                          className="shrink-0 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                        >
                          Putuskan
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── REPORTS TAB ───────────────────────────────────────────────────── */}
          {tab === 'reports' && reports && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Semua Laporan ({reports.Total})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Laporan</th>
                      <th className="px-4 py-3 text-left">Tipe</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Pelapor</th>
                      <th className="px-4 py-3 text-left">Tanggal</th>
                      <th className="px-4 py-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reports.Data.map(r => (
                      <tr key={r.Id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-xs"><p className="line-clamp-1">{r.Title}</p><p className="text-xs text-gray-400">{r.Location}</p></td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.Type === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.Type === 'LOST' ? 'Hilang' : 'Temuan'}</span></td>
                        <td className="px-4 py-3"><StatusBadge status={r.Status} size="sm" /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.ReporterName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.CreatedAt).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3">
                          {r.Status === 'PENDING' && (
                            <button
                              onClick={() => { setVerifyModal({ report: r }); setVerifyForm({ Status: 'OPEN', ModeratorNote: '' }); setModalError(''); }}
                              className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                            >
                              Verifikasi
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

          {/* ── CLAIMS TAB ────────────────────────────────────────────────────── */}
          {tab === 'claims' && claims && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Semua Klaim ({claims.Total})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Laporan</th>
                      <th className="px-4 py-3 text-left">Pemohon</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Tanggal</th>
                      <th className="px-4 py-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {claims.Data.map(c => (
                      <tr key={c.Id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-xs"><p className="line-clamp-1">{c.ReportTitle}</p></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{c.ClaimantName}<br />{c.ContactPhone}</td>
                        <td className="px-4 py-3"><StatusBadge status={c.Status} size="sm" /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.CreatedAt).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3 flex gap-1">
                          {c.Status === 'PENDING' && (
                            <button
                              onClick={() => { setClaimModal({ claim: c }); setClaimForm({ Status: 'APPROVED', DecisionNote: '' }); setModalError(''); }}
                              className="px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                            >
                              Putuskan
                            </button>
                          )}
                          {c.Status === 'APPROVED' && (
                            <button
                              onClick={() => { setHandoverModal({ claim: c }); setHandoverForm({ RecipientName: '', HandoverLocation: '', Note: '' }); setModalError(''); }}
                              className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                            >
                              Handover
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

          {/* ── CATEGORIES TAB ───────────────────────────────────────────────── */}
          {tab === 'categories' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Kategori ({categories.length})</h2>
                <button
                  onClick={() => { setCatModal({}); setCatForm({ Name: '', Description: '' }); setModalError(''); }}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  + Tambah
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {categories.map(c => (
                  <div key={c.Id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <span className="font-medium text-sm text-gray-900">{c.Name}</span>
                      {c.Description && <span className="text-xs text-gray-400 ml-2">{c.Description}</span>}
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.IsActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.IsActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <button
                        onClick={() => { setCatModal({ cat: c }); setCatForm({ Name: c.Name, Description: c.Description || '' }); setModalError(''); }}
                        className="text-xs text-gray-500 hover:text-purple-600 px-2 py-0.5 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleCat(c)}
                        className={`text-xs px-2 py-0.5 rounded-lg transition-colors ${c.IsActive ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {c.IsActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
          {tab === 'users' && users && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="p-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">Pengguna ({users.Total})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-4 py-3 text-left">Nama</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">NIM</th>
                      <th className="px-4 py-3 text-left">Peran</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.Data.map(u => (
                      <tr key={u.Id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.Name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.Email}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.StudentNumber || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.Role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {u.Role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${u.IsActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.IsActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleUser(u)}
                            disabled={u.Id === user?.Id}
                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 ${u.IsActive ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-green-600 bg-green-50 hover:bg-green-100'}`}
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
        </>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      {/* Verify modal */}
      {verifyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-1">Verifikasi Laporan</h3>
            <p className="text-sm text-gray-500 mb-4 line-clamp-1">{verifyModal.report.Title}</p>
            {modalError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-600">{modalError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keputusan</label>
                <select value={verifyForm.Status} onChange={e => setVerifyForm(p => ({ ...p, Status: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white">
                  <option value="OPEN">Setujui (OPEN)</option>
                  <option value="REJECTED">Tolak (REJECTED)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Admin (opsional)</label>
                <textarea value={verifyForm.ModeratorNote} onChange={e => setVerifyForm(p => ({ ...p, ModeratorNote: e.target.value }))}
                  placeholder="Catatan untuk pelapor..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setVerifyModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={submitVerify} disabled={modalLoading} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {modalLoading ? 'Memproses...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decide claim modal */}
      {claimModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-1">Putuskan Klaim</h3>
            <p className="text-sm text-gray-500 mb-1">{claimModal.claim.ClaimantName}</p>
            <p className="text-xs text-gray-400 mb-4 line-clamp-1">Laporan: {claimModal.claim.ReportTitle}</p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="text-xs font-medium text-gray-600 mb-1">Bukti Kepemilikan:</div>
              <p className="text-xs text-gray-700">{claimModal.claim.ProofAnswer}</p>
              <div className="text-xs font-medium text-gray-600 mt-2 mb-1">Deskripsi:</div>
              <p className="text-xs text-gray-700">{claimModal.claim.OwnershipDescription}</p>
              <div className="text-xs font-medium text-gray-600 mt-2 mb-1">Telepon:</div>
              <p className="text-xs text-gray-700">{claimModal.claim.ContactPhone}</p>
            </div>
            {modalError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-600">{modalError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keputusan</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ value: 'APPROVED', label: '✅ Setujui' }, { value: 'REJECTED', label: '❌ Tolak' }].map(opt => (
                    <label key={opt.value} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${claimForm.Status === opt.value ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="claimStatus" value={opt.value} checked={claimForm.Status === opt.value} onChange={e => setClaimForm(p => ({ ...p, Status: e.target.value }))} className="sr-only" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Keputusan *</label>
                <textarea required value={claimForm.DecisionNote} onChange={e => setClaimForm(p => ({ ...p, DecisionNote: e.target.value }))}
                  placeholder="Alasan keputusan Anda..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setClaimModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={submitClaim} disabled={modalLoading || !claimForm.DecisionNote} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {modalLoading ? 'Memproses...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handover modal */}
      {handoverModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-1">Catat Serah Terima</h3>
            <p className="text-sm text-gray-500 mb-4">{handoverModal.claim.ReportTitle}</p>
            {modalError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-600">{modalError}</div>}
            <div className="space-y-3">
              {[
                { label: 'Nama Penerima *', key: 'RecipientName', placeholder: 'Nama lengkap penerima' },
                { label: 'Lokasi Serah Terima *', key: 'HandoverLocation', placeholder: 'cth. Ruang Satpam Gedung Utama' },
                { label: 'Catatan (opsional)', key: 'Note', placeholder: 'Catatan tambahan...' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type="text"
                    value={(handoverForm as any)[key]}
                    onChange={e => setHandoverForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setHandoverModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={submitHandover} disabled={modalLoading || !handoverForm.RecipientName || !handoverForm.HandoverLocation} className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {modalLoading ? 'Memproses...' : 'Catat Serah Terima'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category modal */}
      {catModal !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-4">{catModal.cat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
            {modalError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3 text-sm text-red-600">{modalError}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama *</label>
                <input type="text" value={catForm.Name} onChange={e => setCatForm(p => ({ ...p, Name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
                <input type="text" value={catForm.Description} onChange={e => setCatForm(p => ({ ...p, Description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setCatModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Batal</button>
              <button onClick={submitCat} disabled={modalLoading || !catForm.Name} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {modalLoading ? 'Memproses...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
