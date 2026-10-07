import React from 'react';
import { ReportStatus, ReportType } from '@campusfind/shared';

interface StatusBadgeProps {
  status: ReportStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case ReportStatus.PENDING:
      case 'PENDING':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case ReportStatus.OPEN:
      case 'OPEN':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ReportStatus.MATCHED:
      case 'MATCHED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case ReportStatus.CLAIMED:
      case 'CLAIMED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ReportStatus.RETURNED:
      case 'RETURNED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case ReportStatus.REJECTED:
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case ReportStatus.ARCHIVED:
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case ReportStatus.PENDING:
      case 'PENDING':
        return 'Menunggu Verifikasi';
      case ReportStatus.OPEN:
      case 'OPEN':
        return 'Terbuka / Aktif';
      case ReportStatus.MATCHED:
      case 'MATCHED':
        return 'Ditemukan / Cocok';
      case ReportStatus.CLAIMED:
      case 'CLAIMED':
        return 'Diklaim';
      case ReportStatus.RETURNED:
      case 'RETURNED':
        return 'Telah Dikembalikan';
      case ReportStatus.REJECTED:
      case 'REJECTED':
        return 'Ditolak';
      case ReportStatus.ARCHIVED:
      case 'ARCHIVED':
        return 'Diarsipkan';
      default:
        return status;
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${sizeClasses} ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {getStatusLabel()}
    </span>
  );
};

export const TypeBadge: React.FC<{ type: ReportType | string; size?: 'sm' | 'md' }> = ({
  type,
  size = 'md',
}) => {
  const isLost = type === ReportType.LOST || type === 'LOST';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full ${sizeClasses} ${
        isLost
          ? 'bg-rose-50 text-rose-700 border border-rose-200'
          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
      }`}
    >
      {isLost ? 'Kehilangan' : 'Ditemukan'}
    </span>
  );
};
