import type { NextFunction, Request, Response } from 'express';
import { getUserIdFromToken } from '../utils/jwt';
import { getAuthToken } from '../utils/helpers';

export async function isAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const token = getAuthToken(req);

        req.userId = await getUserIdFromToken(token);
    } catch (err) {
        res.status(401);

        throw new Error('Unauthorized.');
    }

    return next();
}
