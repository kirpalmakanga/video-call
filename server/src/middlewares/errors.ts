import type { NextFunction, Request, Response } from 'express';

export function notFound(_: Request, res: Response, next: NextFunction) {
    const error = new Error(`Not found.`);

    res.status(404);

    next(error);
}

export function errorHandler(
    error: Error,
    _: Request,
    res: Response,
    next: NextFunction
) {
    if (error) {
        const { message, stack } = error;
        const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

        console.error(stack);

        res.status(statusCode);

        res.json({
            error: message,
            ...(process.env.NODE_ENV !== 'production' && {
                stack
            })
        });
    }

    next();
}
