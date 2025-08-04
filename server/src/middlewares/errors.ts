import type { NextFunction, Request, Response } from 'express';

export function notFound(req: Request, res: Response, next: NextFunction) {
    const error = new Error(`Not found.`);

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
