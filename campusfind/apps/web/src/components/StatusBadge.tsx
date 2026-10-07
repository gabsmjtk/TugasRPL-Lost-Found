import React from 'react';

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  PENDING:  { label: 'Menunggu',   classes: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  OPEN:     { label: 'Aktif',      classes: 'bg-blue-100 text-blue-800 border-blue-200' },
  MATCHED:  { label: 'Cocok',      classes: 'bg-purple-100 text-purple-800 border-purple-200' },
  CLAIMED:  { label: 'Diklaim',    classes: 'bg-orange-100 text-orange-800 border-orange-200' },
  RETURNED: { label: 'Dikembalikan', classes: 'bg-green-100 text-green-800 border-green-200' },
  REJECTED: { label: 'Ditolak',   classes: 'bg-red-100 text-red-800 border-red-200' },
  ARCHIVED: { label: 'Diarsipkan', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
  // Claim statuses
  APPROVED:  { label: 'Disetujui', classes: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED: { label: 'Dibatalkan', classes: 'bg-gray-100 text-gray-700 border-gray-200' },
  COMPLETED: { label: 'Selesai',   classes: 'bg-teal-100 text-teal-800 border-teal-200' },
};

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const config = STATUS_MAP[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700 border-gray-200' };
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${config.classes} ${sizeClass}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
