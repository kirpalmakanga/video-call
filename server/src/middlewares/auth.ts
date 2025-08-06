import type { NextFunction, Request, Response } from 'express';
import { getUserIdFromToken } from '../utils/jwt';

export async function isAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        res.status(401);
        throw new Error('Unauthorized.');
    }

    try {
        const token = authorization.split(' ')[1];

        if (token) {
            req.userId = await getUserIdFromToken(token);
        }
    } catch (err) {
        res.status(401);

        throw new Error('Unauthorized.');
    }

    return next();
}
