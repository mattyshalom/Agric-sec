import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import * as service from './auth.service';
import prisma from '../../config/database';

export const register = asyncHandler(async (req, res) => {
  const result = await service.register(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await service.login(email, password);
  res.json({ success: true, data: result });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await service.refresh(refreshToken);
  res.json({ success: true, data: tokens });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  await service.logout(req.user!.id, refreshToken);
  res.json({ success: true, message: 'Logged out' });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, role: true, avatarUrl: true, isVerified: true, createdAt: true,
    },
  });
  res.json({ success: true, data: user });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, phone, avatarUrl } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { firstName, lastName, phone, avatarUrl },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      phone: true, role: true, avatarUrl: true,
    },
  });
  res.json({ success: true, data: user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await service.changePassword(req.user!.id, currentPassword, newPassword);
  res.json({ success: true, message: 'Password changed successfully' });
});
