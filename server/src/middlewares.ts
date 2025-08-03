import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { type AnySchema } from 'yup';

const jwt = require('jsonwebtoken');

export function notFound(req: Request, res: Response, next: NextFunction) {
    const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);

    res.status(404);

    next(error);
}

export function errorHandler(
    { message, stack }: Error,
    req: Request,
    res: Response
) {
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

    res.status(statusCode);

    res.json({
        message,
        ...(process.env.NODE_ENV !== 'production' && {
            stack
        })
    });
}

export function isAuthenticated(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const { authorization } = req.headers;

    if (!authorization) {
        res.status(401);
        throw new Error('🚫 Un-Authorized 🚫');
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
        throw new Error('🚫 Un-Authorized 🚫');
    }

    return next();
}

export function validate(schema: AnySchema): RequestHandler {
    return async ({ body }, res, next) => {
        try {
            await schema.validate(body, { strict: true, abortEarly: false });

            next();
        } catch (error) {
            res.status(400).json({ errors: error.errors });
        }
    };
}
