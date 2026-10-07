import { describe, it, expect } from 'vitest';
import { filterReports } from './filterValidation';

describe('Filter Reports Helper Tests', () => {
  const dummyData = [
    { Title: 'Kunci Motor Honda', Type: 'LOST', CategoryId: '1' },
    { Title: 'Dompet Kulit Coklat', Type: 'FOUND', CategoryId: '2' },
    { Title: 'Laptop Asus Hitam', Type: 'LOST', CategoryId: '1' },
  ];

  it('harus memfilter laporan berdasarkan kata kunci pencarian', () => {
    const result = filterReports(dummyData, 'Laptop', '', '');
    expect(result).toHaveLength(1);
    expect(result[0].Title).toBe('Laptop Asus Hitam');
  });

  it('harus memfilter laporan berdasarkan tipe (LOST/FOUND)', () => {
    const result = filterReports(dummyData, '', 'FOUND', '');
    expect(result).toHaveLength(1);
    expect(result[0].Title).toBe('Dompet Kulit Coklat');
  });

  it('harus memfilter laporan berdasarkan kategori', () => {
    const result = filterReports(dummyData, '', '', '1');
    expect(result).toHaveLength(2);
  });
});