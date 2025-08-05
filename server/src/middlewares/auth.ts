import type { NextFunction, Request, Response } from 'express';
import { getUserFromToken } from '../utils/jwt';

export function isAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const { authorization } = req.headers;

    if (!authorization) {
        res.status(401);
        throw new Error('Unauthorized.');
    }

    try {
        const token = authorization.split(' ')[1];

        if (token) {
            req.userId = getUserFromToken(token).id;
        }
    } catch (err) {
        res.status(401);

        if (err.name === 'TokenExpiredError') {
            throw new Error(err.name);
        }

        throw new Error('Unauthorized.');
    }

    return next();
}
