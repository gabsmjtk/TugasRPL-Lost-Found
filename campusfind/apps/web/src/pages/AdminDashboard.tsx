import React, { useEffect, useState } from 'react';

interface Report {
  Id: number;
  Title: string;
  Type: 'LOST' | 'FOUND';
  Status: string;
  Location: string;
  CreatedAt: string;
  Reporter?: { Name: string };
}

export default function AdminDashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.data || data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVerify = async (reportId: number, status: 'OPEN' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/reports/${reportId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ Status: status })
      });
      fetchAdminData();
    } catch (err) {
      alert('Gagal memproses verifikasi');
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat data admin...</div>;

  const pendingReports = reports.filter(r => r.Status === 'PENDING');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

      {/* Ringkasan Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium">Laporan Menunggu Verifikasi</p>
          <p className="text-3xl font-bold text-yellow-900">{pendingReports.length}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-blue-800 text-sm font-medium">Total Laporan Terdaftar</p>
          <p className="text-3xl font-bold text-blue-900">{reports.length}</p>
        </div>
      </div>

      {/* Tabel Verifikasi Laporan */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Laporan Menunggu Verifikasi</h2>
        {pendingReports.length === 0 ? (
          <p className="text-gray-500 italic">Tidak ada laporan pending saat ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3">Judul</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3">Pelapor</th>
                  <th className="p-3">Lokasi</th>
                  <th className="p-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingReports.map((report) => (
                  <tr key={report.Id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{report.Title}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded font-semibold ${
                        report.Type === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {report.Type === 'LOST' ? 'HILANG' : 'DITEMUKAN'}
                      </span>
                    </td>
                    <td className="p-3">{report.Reporter?.Name || '-'}</td>
                    <td className="p-3">{report.Location}</td>
                    <td className="p-3 space-x-2">
                      <button
                        onClick={() => handleVerify(report.Id, 'OPEN')}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded transition"
                      >
                        Setujui (OPEN)
                      </button>
                      <button
                        onClick={() => handleVerify(report.Id, 'REJECTED')}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded transition"
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
    </div>
  );
}