import { object, string, type InferType } from 'yup';

export const createRoomSchema = object({
    name: string().required('Room name required')
}).exact();

export type CreateRoomSchema = InferType<typeof createRoomSchema>;

export const loginSchema = object({
    email: string().email('Invalid email').required('Email required'),
    password: string()
        .min(8, 'Must be at least 8 characters')
        .required('Password required')
}).exact();

export type LoginSchema = InferType<typeof loginSchema>;

export const refreshTokenSchema = object({
    refreshToken: string().required('Refresh token required')
}).exact();

export type RefreshTokenSchema = InferType<typeof refreshTokenSchema>;
