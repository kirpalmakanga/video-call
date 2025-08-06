import type { NextFunction, Request, Response } from 'express';
import { getUserIdFromToken } from '../utils/jwt';

export async function isAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const {
            headers: { authorization }
        } = req;

        if (!authorization || !authorization.startsWith('Bearer ')) {
            throw new Error('Invalid authorization');
        }

        const token = authorization.split(' ')[1];

        if (token) {
            req.userId = await getUserIdFromToken(token);
        } else {
            throw new Error('Invalid token');
        }
    } catch (err) {
        res.status(401);

        throw new Error('Unauthorized.');
    }

    return next();
}
