import type { NextFunction, Response } from 'express';
import { getUserById, updateUser } from '../services/users.service';
import type { UpdateProfileFormData } from '../validation/user.validation';
import { omit } from '../utils/helpers.utils';

export async function getProfile(
    { userId }: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getUserById(userId);

        if (user) {
            return res.json(omit(user, 'password', 'createdAt', 'updatedAt'));
        }

        res.status(404);
    } catch (error) {
        next(error);
    }
}

interface UpdateProfileRequest extends AuthenticatedRequest {
    body: UpdateProfileFormData;
}

export async function updateProfile(
    { userId, body }: UpdateProfileRequest,
    res: Response,
    next: NextFunction
) {
    try {
        await updateUser(userId, body);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
}
