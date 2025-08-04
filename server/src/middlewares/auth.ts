import type { NextFunction, Request, Response } from 'express';

const jwt = require('jsonwebtoken');

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
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        req.userId = payload.userId;
    } catch (err) {
        res.status(401);

        if (err.name === 'TokenExpiredError') {
            throw new Error(err.name);
        }

        throw new Error('Unauthorized.');
    }

    return next();
}
