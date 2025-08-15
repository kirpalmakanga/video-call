import { object, string, ref, type InferType } from 'yup';

export const registerSchema = object({
    firstName: string().required('First name is required'),
    lastName: string().required('Last name is required'),
    email: string().email('Invalid email').required('Email is required'),
    password: string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required')
}).exact();

export type RegisterSchema = InferType<typeof registerSchema>;

export const loginSchema = object({
    email: string().email('Invalid email').required('Email is required'),
    password: string().required('Password is required')
}).exact();

export type LoginSchema = InferType<typeof loginSchema>;

export const refreshTokenSchema = object({
    refreshToken: string().required('Refresh token required')
}).exact();

export type RefreshTokenSchema = InferType<typeof refreshTokenSchema>;

export const updatePasswordSchema = object({
    password: string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required')
}).exact();

export type UpdatePasswordSchema = InferType<typeof updatePasswordSchema>;

export const verificationTokenSchema = object({
    verificationToken: string().required()
}).exact();

export type VerificationTokenSchema = InferType<typeof verificationTokenSchema>;

export const resetTokenSchema = object({
    resetToken: string().required()
}).exact();

export type ResetTokenSchema = InferType<typeof resetTokenSchema>;

export const emailSchema = object({
    email: string().email('Invalid email').required('Email required')
}).exact();

export const resetPasswordSchema = object({
    password: string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
    confirmPassword: string()
        .required()
        .oneOf([ref('password')], 'Must match password')
}).exact();

export type ResetPasswordSchema = InferType<typeof resetPasswordSchema>;
