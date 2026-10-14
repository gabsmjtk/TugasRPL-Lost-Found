import { authService } from '../src/services/auth.service';
import { prisma } from '../src/utils/prisma';
import bcrypt from 'bcryptjs';
import { Role } from '@campusfind/shared';
import { UnauthorizedError, BadRequestError } from '../src/utils/errors';

jest.mock('../src/utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('US-01: Autentikasi Pengguna (AuthService)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AC 1: Jika email dan password benar, sistem mengembalikan JWT', () => {
    it('harus mengembalikan token JWT dan data user summary jika kredensial valid', async () => {
      const mockUser = {
        Id: 'usr-123',
        Name: 'Budi Santoso',
        Email: 'budi@campus.ac.id',
        StudentNumber: '12345678',
        PasswordHash: '$2a$10$hashedpassword',
        Role: Role.STUDENT,
        IsActive: true,
        CreatedAt: new Date('2026-01-01'),
        UpdatedAt: new Date('2026-01-01'),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login({
        Email: 'budi@campus.ac.id',
        Password: 'Password123!',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { Email: 'budi@campus.ac.id' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('Password123!', mockUser.PasswordHash);
      expect(result).toHaveProperty('Token');
      expect(typeof result.Token).toBe('string');
      expect(result.Token.length).toBeGreaterThan(10);
      expect(result.User).toMatchObject({
        Id: 'usr-123',
        Email: 'budi@campus.ac.id',
        Name: 'Budi Santoso',
        Role: Role.STUDENT,
      });
    });
  });

  describe('AC 2: Jika password salah, sistem menolak dengan status 401 Unauthorized', () => {
    it('harus melempar UnauthorizedError (status 401) saat password tidak cocok', async () => {
      const mockUser = {
        Id: 'usr-123',
        Name: 'Budi Santoso',
        Email: 'budi@campus.ac.id',
        StudentNumber: '12345678',
        PasswordHash: '$2a$10$hashedpassword',
        Role: Role.STUDENT,
        IsActive: true,
        CreatedAt: new Date(),
        UpdatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login({
          Email: 'budi@campus.ac.id',
          Password: 'WrongPassword',
        })
      ).rejects.toThrow(UnauthorizedError);

      try {
        await authService.login({
          Email: 'budi@campus.ac.id',
          Password: 'WrongPassword',
        });
      } catch (err: any) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Invalid credentials');
      }
    });

    it('harus melempar UnauthorizedError (status 401) jika user tidak ditemukan atau non-aktif', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({
          Email: 'notfound@campus.ac.id',
          Password: 'Password123!',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('harus melempar BadRequestError jika parameter email atau password kosong', async () => {
      await expect(
        authService.login({
          Email: '',
          Password: 'Password123!',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
