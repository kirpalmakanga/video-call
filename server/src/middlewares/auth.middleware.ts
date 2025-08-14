import type { NextFunction, Request, Response } from 'express';
import { getUserIdFromToken } from '../utils/jwt.utils';
import { getAuthToken } from '../utils/auth.utils';
import { unauthorized } from '../utils/response';

export async function isAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const token = getAuthToken(req);

        req.userId = await getUserIdFromToken(token);

        next();
    } catch (err) {
        unauthorized(res);
    }
}
