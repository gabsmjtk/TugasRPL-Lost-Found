import { PrismaClient, Role, ReportType, ReportStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean up
  await prisma.handover.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.reportImage.deleteMany();
  await prisma.report.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Categories
  const categoryNames = [
    'Elektronik',
    'Aksesori',
    'Dokumen',
    'Pakaian',
    'Buku dan Alat Tulis',
    'Kunci',
    'Dompet',
    'Lainnya'
  ];

  const categories = [];
  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: { Name: name }
    });
    categories.push(category);
  }
  console.log('Categories created.');

  // 3. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      Name: 'Administrator',
      Email: 'admin@campusfind.ac.id',
      PasswordHash: passwordHash,
      Role: Role.ADMIN,
    }
  });

  const student1 = await prisma.user.create({
    data: {
      Name: 'Budi Santoso',
      StudentNumber: '11223344',
      Email: 'student1@campusfind.ac.id',
      PasswordHash: passwordHash,
      Role: Role.STUDENT,
    }
  });

  const student2 = await prisma.user.create({
    data: {
      Name: 'Siti Aminah',
      StudentNumber: '22334455',
      Email: 'student2@campusfind.ac.id',
      PasswordHash: passwordHash,
      Role: Role.STUDENT,
    }
  });

  const student3 = await prisma.user.create({
    data: {
      Name: 'Joko Widodo', // Example name
      StudentNumber: '33445566',
      Email: 'student3@campusfind.ac.id',
      PasswordHash: passwordHash,
      Role: Role.STUDENT,
    }
  });
  console.log('Users created.');

  // 4. Create Reports (mixed statuses)
  // PENDING LOST
  await prisma.report.create({
    data: {
      ReporterId: student1.Id,
      CategoryId: categories[0].Id, // Elektronik
      Type: ReportType.LOST,
      Status: ReportStatus.PENDING,
      Title: 'Kehilangan Laptop Asus',
      Description: 'Laptop Asus warna hitam hilang di kantin utama',
      Location: 'Kantin Utama',
      EventAt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 1 day ago
    }
  });

  // OPEN FOUND
  const openFound = await prisma.report.create({
    data: {
      ReporterId: student2.Id,
      CategoryId: categories[6].Id, // Dompet
      Type: ReportType.FOUND,
      Status: ReportStatus.OPEN,
      Title: 'Menemukan Dompet Hitam',
      Description: 'Ditemukan dompet kulit hitam di depan perpustakaan',
      Location: 'Depan Perpustakaan',
      EventAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      VerifiedAt: new Date(),
      VerifiedById: admin.Id,
    }
  });

  // OPEN LOST
  await prisma.report.create({
    data: {
      ReporterId: student3.Id,
      CategoryId: categories[5].Id, // Kunci
      Type: ReportType.LOST,
      Status: ReportStatus.OPEN,
      Title: 'Kunci Motor Hilang',
      Description: 'Kunci motor Honda dengan gantungan boneka',
      Location: 'Parkiran Motor B',
      EventAt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
      VerifiedAt: new Date(),
      VerifiedById: admin.Id,
    }
  });

  // CLAIMED FOUND
  const claimedFound = await prisma.report.create({
    data: {
      ReporterId: student1.Id,
      CategoryId: categories[2].Id, // Dokumen
      Type: ReportType.FOUND,
      Status: ReportStatus.CLAIMED,
      Title: 'KTM atas nama Budi',
      Description: 'KTM jatuh di ruang kelas 101',
      Location: 'Ruang 101',
      EventAt: new Date(new Date().getTime() - 4 * 24 * 60 * 60 * 1000),
      VerifiedAt: new Date(),
      VerifiedById: admin.Id,
    }
  });

  // RETURNED FOUND
  const returnedFound = await prisma.report.create({
    data: {
      ReporterId: student2.Id,
      CategoryId: categories[0].Id, // Elektronik
      Type: ReportType.FOUND,
      Status: ReportStatus.RETURNED,
      Title: 'Flasdisk SanDisk 32GB',
      Description: 'Ditemukan di lab komputer',
      Location: 'Lab Komputer A',
      EventAt: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000),
      VerifiedAt: new Date(),
      VerifiedById: admin.Id,
    }
  });

  // MATCHED LOST
  await prisma.report.create({
    data: {
      ReporterId: student3.Id,
      CategoryId: categories[4].Id, // Buku
      Type: ReportType.LOST,
      Status: ReportStatus.MATCHED,
      Title: 'Buku Catatan RPL',
      Description: 'Buku tulis sidu warna biru',
      Location: 'Perpustakaan Lantai 2',
      EventAt: new Date(new Date().getTime() - 6 * 24 * 60 * 60 * 1000),
      VerifiedAt: new Date(),
      VerifiedById: admin.Id,
    }
  });
  console.log('Reports created.');

  // Create Claims
  // Claim for CLAIMED FOUND
  await prisma.claim.create({
    data: {
      ReportId: claimedFound.Id,
      ClaimantId: student3.Id,
      ProofAnswer: 'NIM di KTM adalah 33445566',
      OwnershipDescription: 'KTM itu milik saya yang jatuh saat kuliah pagi',
      ContactPhone: '081234567890',
      Status: 'APPROVED',
      DecidedById: admin.Id,
      DecidedAt: new Date(),
      DecisionNote: 'Bukti valid'
    }
  });

  // Claim for RETURNED FOUND
  const completedClaim = await prisma.claim.create({
    data: {
      ReportId: returnedFound.Id,
      ClaimantId: student1.Id,
      ProofAnswer: 'Di dalam ada file tugas akhir',
      OwnershipDescription: 'Flashdisk merah',
      ContactPhone: '089876543210',
      Status: 'COMPLETED',
      DecidedById: admin.Id,
      DecidedAt: new Date(),
      DecisionNote: 'Diterima'
    }
  });

  // Create Handover for RETURNED FOUND
  await prisma.handover.create({
    data: {
      ReportId: returnedFound.Id,
      ClaimId: completedClaim.Id,
      AdminId: admin.Id,
      RecipientName: student1.Name,
      HandoverLocation: 'Ruang Satpam Utama',
      HandedOverAt: new Date(),
      Note: 'Sudah diserahkan'
    }
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
