import { object, string, type InferType } from 'yup';

export const createRoomSchema = object({
    name: string().required('Required')
}).exact();

export type CreateRoomSchema = InferType<typeof createRoomSchema>;

export const loginSchema = object({
    email: string().email('Invalid email').required('Required'),
    password: string()
        .min(8, 'Must be at least 8 characters')
        .required('Required')
}).exact();

export type LoginSchema = InferType<typeof loginSchema>;

export const refreshTokenSchema = object({
    refreshToken: string().required('Required')
}).exact();

export type RefreshTokenSchema = InferType<typeof refreshTokenSchema>;
