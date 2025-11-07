import { z } from 'zod';

// Email validation
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .trim()
  .toLowerCase();

// Password validation
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters');

// Username validation
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be less than 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens')
  .trim();

// Display name validation
export const displayNameSchema = z.string()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be less than 100 characters')
  .trim();

// Post content validation
export const postContentSchema = z.string()
  .max(5000, 'Post must be less than 5000 characters')
  .trim();

// Verification code validation
export const verificationCodeSchema = z.string()
  .regex(/^\d{12}$/, 'Verification code must be exactly 12 digits');

// OTP code validation
export const otpCodeSchema = z.string()
  .regex(/^\d{6}$/, 'Code must be exactly 6 digits');

// Bio validation
export const bioSchema = z.string()
  .max(500, 'Bio must be less than 500 characters')
  .optional();

// URL validation
export const urlSchema = z.string()
  .url('Invalid URL format')
  .max(500, 'URL must be less than 500 characters')
  .optional()
  .or(z.literal(''));

// Phone number validation (basic)
export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

// Comment validation
export const commentSchema = z.string()
  .min(1, 'Comment cannot be empty')
  .max(1000, 'Comment must be less than 1000 characters')
  .trim();

// Sign in form schema
export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Sign up form schema
export const signUpSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
});

// Profile update schema
export const profileUpdateSchema = z.object({
  displayName: displayNameSchema.optional(),
  bio: bioSchema,
  website: urlSchema,
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
});

// Create post schema
export const createPostSchema = z.object({
  content: postContentSchema,
  mediaFiles: z.array(z.instanceof(File)).max(10, 'Maximum 10 media files allowed').optional(),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Reset password schema
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Email verification schema
export const emailVerificationSchema = z.object({
  code: otpCodeSchema,
});
