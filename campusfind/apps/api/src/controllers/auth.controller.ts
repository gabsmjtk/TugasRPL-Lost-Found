import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';

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
    await authService.register(data);
    res.status(201).json({ Message: 'Registration successful' });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const me = (req: Request, res: Response) => {
  res.json(req.user);
};
