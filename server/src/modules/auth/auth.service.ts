import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError, conflict, unauthorized } from '../../common/errors/app-error';
import type { AuthPayload } from '../../common/middleware/auth';
import { createAuditLog } from '../audit/audit.service';

const BCRYPT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) + '-' + uuid().slice(0, 6);
}

export async function register(input: { name: string; businessName: string; email: string; password: string }): Promise<{ user: { id: string; name: string; email: string; emailVerified: boolean }; organization: { id: string; name: string; slug: string }; token: string }> {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw conflict('CONFLICT', 'An account with this email already exists.', { email: 'This email is already registered' });

  const passwordHash = await hashPassword(input.password);
  const userId = uuid();
  const slug = slugify(input.businessName);

  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      name: input.name,
      passwordHash,
      emailVerifyToken: uuid(),
    },
  });

  const organization = await prisma.organization.create({
    data: {
      name: input.businessName,
      slug,
      ownerId: user.id,
    },
  });

  await prisma.organizationMember.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      role: 'owner',
    },
  });

  const token = signToken({ userId: user.id, organizationId: organization.id, email: user.email });

  await createAuditLog({ action: 'USER_REGISTERED', actorId: user.id, organizationId: organization.id, metadata: { email } });

  return {
    user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
    organization: { id: organization.id, name: organization.name, slug: organization.slug },
    token,
  };
}

export async function login(input: { email: string; password: string }): Promise<{ user: { id: string; name: string; email: string; emailVerified: boolean }; organization: { id: string; name: string; slug: string }; token: string }> {
  const email = input.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized('Incorrect email or password.');

  // Check lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(423, 'RATE_LIMITED', 'Account temporarily locked due to multiple failed attempts. Please try again later.');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    const attempts = user.failedLoginAttempts + 1;
    const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
    await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: attempts, lockedUntil } });
    throw unauthorized('Incorrect email or password.');
  }

  // Reset attempts on success
  await prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });

  const membership = await prisma.organizationMember.findFirst({ where: { userId: user.id }, include: { organization: true } });
  if (!membership) throw new AppError(500, 'INTERNAL_ERROR', 'We couldn\'t load your account. Please try again.');

  const token = signToken({ userId: user.id, organizationId: membership.organization.id, email: user.email });

  await createAuditLog({ action: 'USER_LOGIN', actorId: user.id, organizationId: membership.organization.id });

  return {
    user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
    organization: { id: membership.organization.id, name: membership.organization.name, slug: membership.organization.slug },
    token,
  };
}

export async function verifyEmail(userId: string): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { emailVerified: true, emailVerifyToken: null } });
}

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return; // Don't reveal existence
  const token = uuid();
  await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) } });
  // In production, send email via provider
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Reset link is invalid or expired.');
  }
  const hash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash, resetToken: null, resetTokenExpiry: null } });
}
