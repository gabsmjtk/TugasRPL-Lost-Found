import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { Role } from '@campusfind/shared';
import { BadRequestError, UnauthorizedError } from '../utils/errors';

export interface LoginDTO {
  Email: string;
  Password: string;
}

export interface RegisterDTO {
  Name: string;
  StudentNumber: string;
  Email: string;
  Password: string;
}

export class AuthService {
  async login(data: LoginDTO) {
    if (!data.Email || !data.Password) {
      throw new BadRequestError('Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { Email: data.Email },
    });

    if (!user || !user.IsActive) {
      throw new UnauthorizedError('Invalid credentials or account inactive');
    }

    const isMatch = await bcrypt.compare(data.Password, user.PasswordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const userSummary = {
      Id: user.Id,
      Name: user.Name,
      Email: user.Email,
      StudentNumber: user.StudentNumber,
      Role: user.Role as Role,
      IsActive: user.IsActive,
      CreatedAt: user.CreatedAt.toISOString(),
      UpdatedAt: user.UpdatedAt.toISOString(),
    };

    const token = generateToken(userSummary);

    return {
      Token: token,
      User: userSummary,
    };
  }

  async register(data: RegisterDTO) {
    if (!data.Name || !data.StudentNumber || !data.Email || !data.Password) {
      throw new BadRequestError('All fields are required');
    }

    const existingEmail = await prisma.user.findUnique({
      where: { Email: data.Email },
    });
    if (existingEmail) {
      throw new BadRequestError('Email already exists');
    }

    const existingStudentNumber = await prisma.user.findUnique({
      where: { StudentNumber: data.StudentNumber },
    });
    if (existingStudentNumber) {
      throw new BadRequestError('Student number already exists');
    }

    const passwordHash = await bcrypt.hash(data.Password, 10);

    const user = await prisma.user.create({
      data: {
        Name: data.Name,
        StudentNumber: data.StudentNumber,
        Email: data.Email,
        PasswordHash: passwordHash,
        Role: Role.STUDENT,
      },
    });

    return {
      Id: user.Id,
      Name: user.Name,
      Email: user.Email,
      Role: user.Role,
    };
  }
}

export const authService = new AuthService();
