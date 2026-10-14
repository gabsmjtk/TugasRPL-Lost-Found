import { handoverService } from '../src/services/handover.service';
import { prisma } from '../src/utils/prisma';
import { ClaimStatus, ReportStatus } from '@campusfind/shared';
import { BadRequestError, NotFoundError } from '../src/utils/errors';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    claim: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    report: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    handover: {
      create: jest.fn(),
    },
  },
}));

describe('US-04: Proses Handover / Klaim Barang (HandoverService)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC 1: Status barang berubah menjadi RESOLVED atau CLAIMED saat proses klaim berhasil', () => {
    it('harus mengubah status laporan menjadi CLAIMED ketika klaim disetujui (APPROVED)', async () => {
      const mockClaim = {
        Id: 'clm-001',
        ReportId: 'rep-found-01',
        ClaimantId: 'usr-student',
        Status: ClaimStatus.PENDING,
        ProofAnswer: 'Terdapat goresan di sudut kiri',
      };

      const updatedClaim = {
        ...mockClaim,
        Status: ClaimStatus.APPROVED,
        DecisionNote: 'Bukti kepemilikan sangat meyakinkan dan cocok',
        DecidedById: 'adm-01',
      };

      (prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim);
      (prisma.claim.update as jest.Mock).mockResolvedValue(updatedClaim);
      (prisma.report.update as jest.Mock).mockResolvedValue({
        Id: 'rep-found-01',
        Status: ReportStatus.CLAIMED,
      });

      const result = await handoverService.decideClaim('adm-01', 'clm-001', {
        Status: 'APPROVED',
        DecisionNote: 'Bukti kepemilikan sangat meyakinkan dan cocok',
      });

      // Klaim diupdate menjadi APPROVED
      expect(prisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { Id: 'clm-001' },
          data: expect.objectContaining({
            Status: ClaimStatus.APPROVED,
            DecisionNote: 'Bukti kepemilikan sangat meyakinkan dan cocok',
          }),
        })
      );

      // US-04 AC 1: Status laporan barang berubah menjadi CLAIMED
      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { Id: 'rep-found-01' },
        data: { Status: ReportStatus.CLAIMED },
      });

      expect(result.Status).toBe(ClaimStatus.APPROVED);
    });

    it('tidak boleh mengubah status barang menjadi CLAIMED jika klaim ditolak (REJECTED)', async () => {
      const mockClaim = {
        Id: 'clm-002',
        ReportId: 'rep-found-02',
        Status: ClaimStatus.PENDING,
      };

      (prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockClaim);
      (prisma.claim.update as jest.Mock).mockResolvedValue({
        ...mockClaim,
        Status: ClaimStatus.REJECTED,
      });

      await handoverService.decideClaim('adm-01', 'clm-002', {
        Status: 'REJECTED',
        DecisionNote: 'Bukti tidak cocok',
      });

      expect(prisma.claim.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ Status: ClaimStatus.REJECTED }),
        })
      );
      expect(prisma.report.update).not.toHaveBeenCalled();
    });

    it('harus menolak keputusan jika klaim tidak berstatus PENDING', async () => {
      const alreadyApprovedClaim = {
        Id: 'clm-003',
        ReportId: 'rep-01',
        Status: ClaimStatus.APPROVED,
      };

      (prisma.claim.findUnique as jest.Mock).mockResolvedValue(alreadyApprovedClaim);

      await expect(
        handoverService.decideClaim('adm-01', 'clm-003', {
          Status: 'APPROVED',
          DecisionNote: 'Duplikat',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('AC 2: Hanya laporan dengan status valid yang dapat diproses handover-nya', () => {
    it('harus berhasil memproses handover jika status laporan valid (misal: CLAIMED)', async () => {
      const mockApprovedClaim = {
        Id: 'clm-valid-01',
        ReportId: 'rep-valid-01',
        Status: ClaimStatus.APPROVED,
      };

      const mockValidReport = {
        Id: 'rep-valid-01',
        Status: ReportStatus.CLAIMED,
      };

      const mockHandover = {
        Id: 'hnd-001',
        ReportId: 'rep-valid-01',
        ClaimId: 'clm-valid-01',
        AdminId: 'adm-01',
        RecipientName: 'Ahmad Dahlan',
        HandoverLocation: 'Pos Keamanan Gedung Utama',
        HandedOverAt: new Date(),
      };

      (prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockApprovedClaim);
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockValidReport);
      (prisma.handover.create as jest.Mock).mockResolvedValue(mockHandover);
      (prisma.report.update as jest.Mock).mockResolvedValue({
        ...mockValidReport,
        Status: ReportStatus.RETURNED,
      });
      (prisma.claim.update as jest.Mock).mockResolvedValue({
        ...mockApprovedClaim,
        Status: ClaimStatus.COMPLETED,
      });

      const result = await handoverService.recordHandover('adm-01', {
        ReportId: 'rep-valid-01',
        ClaimId: 'clm-valid-01',
        RecipientName: 'Ahmad Dahlan',
        HandoverLocation: 'Pos Keamanan Gedung Utama',
        Note: 'Serah terima sukses dengan menunjukkan KTM asli',
      });

      expect(prisma.handover.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ReportId: 'rep-valid-01',
            ClaimId: 'clm-valid-01',
            RecipientName: 'Ahmad Dahlan',
          }),
        })
      );
      expect(prisma.report.update).toHaveBeenCalledWith({
        where: { Id: 'rep-valid-01' },
        data: { Status: ReportStatus.RETURNED },
      });
      expect(prisma.claim.update).toHaveBeenCalledWith({
        where: { Id: 'clm-valid-01' },
        data: { Status: ClaimStatus.COMPLETED },
      });
      expect(result.Id).toBe('hnd-001');
    });

    it('harus menolak proses handover jika status laporan tidak valid (misal: RETURNED atau REJECTED)', async () => {
      const mockApprovedClaim = {
        Id: 'clm-02',
        ReportId: 'rep-invalid-02',
        Status: ClaimStatus.APPROVED,
      };

      // Laporan sudah berstatus RETURNED (tidak valid untuk di-handover lagi)
      const mockInvalidReport = {
        Id: 'rep-invalid-02',
        Status: ReportStatus.RETURNED,
      };

      (prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockApprovedClaim);
      (prisma.report.findUnique as jest.Mock).mockResolvedValue(mockInvalidReport);

      await expect(
        handoverService.recordHandover('adm-01', {
          ReportId: 'rep-invalid-02',
          ClaimId: 'clm-02',
          RecipientName: 'Ahmad',
          HandoverLocation: 'Pos Satpam',
        })
      ).rejects.toThrow('Status laporan tidak valid untuk diproses handover');

      expect(prisma.handover.create).not.toHaveBeenCalled();
    });

    it('harus menolak proses handover jika klaim belum berstatus APPROVED', async () => {
      const mockPendingClaim = {
        Id: 'clm-pending',
        ReportId: 'rep-01',
        Status: ClaimStatus.PENDING,
      };

      (prisma.claim.findUnique as jest.Mock).mockResolvedValue(mockPendingClaim);

      await expect(
        handoverService.recordHandover('adm-01', {
          ReportId: 'rep-01',
          ClaimId: 'clm-pending',
          RecipientName: 'Ahmad',
          HandoverLocation: 'Pos Satpam',
        })
      ).rejects.toThrow(BadRequestError);

      expect(prisma.handover.create).not.toHaveBeenCalled();
    });
  });
});
