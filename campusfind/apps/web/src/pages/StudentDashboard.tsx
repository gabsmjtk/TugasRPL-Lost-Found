import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { StudentDashboardResponse } from '@campusfind/shared';
import { PackageOpen, AlertCircle, CheckCircle, Package } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<StudentDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/me/dashboard');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div></div>;
  if (!data) return <div className="text-center py-20 text-red-500">Gagal memuat data</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Mahasiswa</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Package size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Laporan Saya</p>
            <p className="text-2xl font-bold text-gray-900">{data.Summary.MyReportsCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><AlertCircle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Klaim Aktif</p>
            <p className="text-2xl font-bold text-gray-900">{data.Summary.ActiveClaimsCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-gray-500">Barang Dikembalikan</p>
            <p className="text-2xl font-bold text-gray-900">{data.Summary.ReturnedItemsCount}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Laporan Terbaru</h2>
            <Link to="/reports/create" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Buat Laporan</Link>
          </div>
          <div className="divide-y divide-gray-100">
            {data.MyReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Belum ada laporan</div>
            ) : (
              data.MyReports.map(report => (
                <div key={report.Id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{report.Title}</h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      report.Status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      report.Status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                      report.Status === 'RETURNED' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.Status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{report.Type === 'LOST' ? 'Kehilangan' : 'Ditemukan'} • {report.CategoryName}</p>
                  <p className="text-xs text-gray-400">{new Date(report.CreatedAt).toLocaleDateString('id-ID')}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Klaim Terbaru</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.MyClaims.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Belum ada klaim</div>
            ) : (
              data.MyClaims.map(claim => (
                <div key={claim.Id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{claim.ReportTitle}</h3>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      claim.Status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      claim.Status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      claim.Status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {claim.Status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Diajukan: {new Date(claim.CreatedAt).toLocaleDateString('id-ID')}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
