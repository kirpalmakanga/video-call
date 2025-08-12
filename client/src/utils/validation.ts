import { object, ref, string, type InferType } from 'yup';

export const loginSchema = object({
    email: string().email('Invalid email').required('Required'),
    password: string()
        .min(8, 'Must be at least 8 characters')
        .required('Required')
});

export type LoginFormData = InferType<typeof loginSchema>;

export const registerSchema = object({
    firstName: string().required('Required'),
    lastName: string().required('Required'),
    email: string().email('Invalid email').required('Required'),
    password: string()
        .min(8, 'Must be at least 8 characters')
        .required('Required')
});

export type RegisterFormData = InferType<typeof registerSchema>;

export const updateProfileSchema = object({
    firstName: string().required('Required'),
    lastName: string().required('Required')
});

export type UpdateProfileFormData = InferType<typeof updateProfileSchema>;

export const updatePasswordSchema = object({
    currentPassword: string().required('Required'),
    password: string()
        .required('Required')
        .min(8, 'Must be at least 8 characters')
        .notOneOf([ref('currentPassword')], 'Must match new password'),
    confirmPassword: string()
        .required('Required')
        .oneOf([ref('password')], 'Must match new password')
});

export type UpdatePasswordFormData = InferType<typeof updatePasswordSchema>;
