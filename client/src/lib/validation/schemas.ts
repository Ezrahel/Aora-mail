import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional(),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Enter your full name"),
    businessName: z.string().min(2, "Enter your business name"),
    email: z.email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Include at least one letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: "You must accept the terms to continue",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export const domainSchema = z.object({
  name: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
      "Enter a valid domain (e.g. company.ng)",
    ),
});

export const createMailboxSchema = z.object({
  localPart: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter an email prefix")
    .regex(
      /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/,
      "Use letters, numbers, dots, hyphens, or underscores",
    ),
  domainId: z.string().min(1, "Select a domain"),
  password: z.string().min(10, "Password must be at least 10 characters"),
  quotaBytes: z.number().positive("Select a storage quota"),
});

export const settingsProfileSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  businessName: z.string().min(2, "Enter your business name"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type DomainFormValues = z.infer<typeof domainSchema>;
export type CreateMailboxFormValues = z.infer<typeof createMailboxSchema>;
export type SettingsProfileFormValues = z.infer<typeof settingsProfileSchema>;
