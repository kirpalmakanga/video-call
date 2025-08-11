import { object, string, type InferType } from 'yup';

export const updateProfileSchema = object({
    firstName: string().required('First name is required'),
    lastName: string().required('Last name is required')
});

export type UpdateProfileFormData = InferType<typeof updateProfileSchema>;
