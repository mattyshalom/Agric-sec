import bcrypt from 'bcryptjs';
import { addDays } from 'date-fns';
import prisma from '../../config/database';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../config/jwt';
import { AppError } from '../../utils/AppError';

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already in use', 409);

  const passwordHash = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({
    data: { ...data, password: undefined, passwordHash },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const { passwordHash: _, ...safeUser } = user;
  const tokens = await issueTokens(safeUser);
  return { user: safeUser, ...tokens };
}

export async function refresh(rawToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: rawToken } });
  if (!stored || stored.expiresAt < new Date()) {
    await prisma.refreshToken.deleteMany({ where: { token: rawToken } });
    throw new AppError('Refresh token expired', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw new AppError('User not found', 404);

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const { passwordHash: _, ...safeUser } = user;
  return issueTokens(safeUser);
}

export async function logout(userId: string, refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken, userId } });
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new AppError('Current password is incorrect', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  // Invalidate all refresh tokens
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// ─── Helpers ──────────────────────────────────────────────────────

async function issueTokens(user: { id: string; email: string; role: string }) {
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = addDays(new Date(), 7);
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

  return { accessToken, refreshToken };
}
