import type { NextFunction, Response } from 'express';
import { getUserById, updateUser } from '../services/users.service';
import type { UpdateProfileFormData } from '../validation/user.validation';
import { omit } from '../utils/helpers.utils';
import { notFound, success } from '../utils/response';

export async function getProfile(
    { userId }: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getUserById(userId);

        if (user) {
            return success(
                res,
                omit(user, 'password', 'createdAt', 'updatedAt')
            );
        }

        notFound(res, 'User not found.');
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
        const user = await updateUser(userId, body);

        success(res, user);
    } catch (error) {
        next(error);
    }
}
