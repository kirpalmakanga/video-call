import type { NextFunction, Request, Response } from 'express';
import { getUserById } from '../services/users';
import { omit } from '../utils/helpers';

export async function profile(
    { userId }: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const user = await getUserById(userId);

        if (user) {
            return res.json(omit(user, 'password', 'createdAt', 'updatedAt'));
        }

        res.status(404);
    } catch (err) {
        next(err);
    }
}
