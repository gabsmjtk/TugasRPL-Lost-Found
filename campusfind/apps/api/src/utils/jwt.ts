import jwt, { SignOptions } from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'rahasia-jwt-super-aman';
const expiresIn = (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn'];

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, secret);
};