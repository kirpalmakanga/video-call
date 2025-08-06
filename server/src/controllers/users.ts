import type { Request, Response } from 'express';
import { getUserById } from '../services/users';
import { omit } from '../utils/helpers';
import { assertIsDefined } from '../../../utils/assert';

export async function profile({ userId }: Request, res: Response) {
    assertIsDefined(userId);

    const user = await getUserById(userId);

    if (user) {
        return res.json(omit(user, 'password', 'createdAt', 'updatedAt'));
    }

    res.status(404);
}
