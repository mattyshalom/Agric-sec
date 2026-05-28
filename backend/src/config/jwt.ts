import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;   // userId
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const signAccessToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

export const signRefreshToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

export const verifyAccessToken = (token: string): JwtPayload =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as JwtPayload;
