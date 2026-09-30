import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { generateToken } from '../utils/jwt';
import { Role } from '@campusfind/shared';

const registerSchema = z.object({
  Name: z.string().min(1, 'Name is required'),
  StudentNumber: z.string().min(1, 'Student number is required'),
  Email: z.string().email('Invalid email'),
  Password: z.string().min(8, 'Password must be at least 8 characters'),
  PasswordConfirmation: z.string()
}).refine(data => data.Password === data.PasswordConfirmation, {
  message: "Passwords don't match",
  path: ['PasswordConfirmation'],
});

const loginSchema = z.object({
  Email: z.string().email('Invalid email'),
  Password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingEmail = await prisma.user.findUnique({ where: { Email: data.Email } });
    if (existingEmail) {
      return res.status(400).json({ Message: 'Email already exists' });
    }

    const existingStudentNumber = await prisma.user.findUnique({ where: { StudentNumber: data.StudentNumber } });
    if (existingStudentNumber) {
      return res.status(400).json({ Message: 'Student number already exists' });
    }

    const PasswordHash = await bcrypt.hash(data.Password, 10);

    const user = await prisma.user.create({
      data: {
        Name: data.Name,
        StudentNumber: data.StudentNumber,
        Email: data.Email,
        PasswordHash,
        Role: Role.STUDENT,
      },
    });

    res.status(201).json({ Message: 'Registration successful' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { Email: data.Email } });
    if (!user || !user.IsActive) {
      return res.status(401).json({ Message: 'Invalid credentials or account inactive' });
    }

    const isMatch = await bcrypt.compare(data.Password, user.PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ Message: 'Invalid credentials' });
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

    res.json({ Token: token, User: userSummary });
  } catch (error) {
    next(error);
  }
};

export const me = (req: Request, res: Response) => {
  res.json(req.user);
};
