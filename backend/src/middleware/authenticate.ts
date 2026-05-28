import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { AppError } from '../utils/AppError';
import { Role } from '@prisma/client';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError('No token provided', 401));
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role as Role };
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};

export const authorize = (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
