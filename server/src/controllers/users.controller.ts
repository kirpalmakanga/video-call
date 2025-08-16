import type { H3Event } from 'h3';
import { getUserById, updateUser } from '../services/users.service';
import type { UpdateProfileFormData } from '../validation/user.validation';
import { omit } from '../utils/helpers.utils';
import { notFound } from '../utils/response.utils';
export async function getProfile(event: H3Event) {
    const user = await getUserById(userId);

    if (user) {
        return omit(user, 'password', 'createdAt', 'updatedAt');
    }

    notFound('User not found.');
}

interface UpdateProfileRequest {
    body: UpdateProfileFormData;
}

export async function updateProfile(event: H3Event<UpdateProfileRequest>) {
    const body = await event.req.json();
    const user = await updateUser(userId, body);

    return user;
}
