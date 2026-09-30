import jwt from 'jsonwebtoken';
import { UserSummary } from '@campusfind/shared';

const secret = process.env.JWT_SECRET || 'secret';
const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

export const generateToken = (user: UserSummary): string => {
  return jwt.sign(user, secret, { expiresIn });
};

export const verifyToken = (token: string): UserSummary => {
  return jwt.verify(token, secret) as UserSummary;
};
