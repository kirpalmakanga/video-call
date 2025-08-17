import { readValidatedBody, type H3Event } from 'h3';
import { getUserById, updateUser } from '../services/users.service';
import {
    updateProfileSchema,
    type UpdateProfileFormData
} from '../validation/user.validation';
import { omit } from '../utils/helpers.utils';
import { notFound } from '../utils/response.utils';
export async function getProfile(event: H3Event) {
    const user = await getUserById(event.context.userId);

    if (user) {
        return omit(user, 'password', 'createdAt', 'updatedAt');
    }

    notFound('User not found.');
}

interface UpdateProfileRequest {
    body: UpdateProfileFormData;
}

export async function updateProfile(event: H3Event<UpdateProfileRequest>) {
    const body = await readValidatedBody(event, updateProfileSchema);
    const user = await updateUser(event.context.userId, body);

    return user;
}
