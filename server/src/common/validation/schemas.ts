import { z } from 'zod';

export const emailSchema = z.string().email('Please enter a valid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128).regex(/[A-Za-z]/, 'Include at least one letter').regex(/[0-9]/, 'Include at least one number');
export const domainNameSchema = z.string().trim().toLowerCase().min(3).max(253).regex(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/, 'Enter a valid domain (e.g. company.ng)').transform(v => v.toLowerCase().trim());
export const localPartSchema = z.string().trim().toLowerCase().min(1).max(64).regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, 'Use letters, numbers, dots, hyphens, or underscores');

export const registerSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  businessName: z.string().min(2, 'Business name is required').max(100),
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.boolean().refine(v => v === true, 'You must accept the terms'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
});

export const createDomainSchema = z.object({
  name: domainNameSchema,
});

export const createMailboxSchema = z.object({
  localPart: localPartSchema,
  domainId: z.string().min(1, 'Invalid domain'),
  password: z.string().min(10, 'Password must be at least 10 characters').optional(),
  quotaBytes: z.number().int().positive().optional(),
});

export const createForwarderSchema = z.object({
  domainId: z.string().min(1),
  source: localPartSchema,
  destination: emailSchema,
});

export const selectPlanSchema = z.object({
  planId: z.string().min(1, 'Plan is required'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
