import type { NextFunction, Request, Response } from 'express';
import { error } from '../utils/response';

export function notFound(_: Request, res: Response, next: NextFunction) {
    const error = new Error(`Not found.`);

    res.status(404);

    next(error);
}

export function errorHandler(
    err: Error,
    _: Request,
    res: Response,
    next: NextFunction
) {
    if (err) {
        error(res, err);
    }

    next();
}
