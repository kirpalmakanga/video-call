import type { Response } from 'express';

function sendResponse(
    res: Response,
    code: number,
    body: Record<string, unknown>
) {
    res.status(code).json(body);
}

export function error(res: Response, error: Error) {
    console.error(error);

    sendResponse(res, 500, {
        error: error.message,
        ...(process.env.NODE_ENV !== 'production' && {
            stack: error.stack
        })
    });
}

export function success(res: Response, data?: any) {
    sendResponse(res, 200, data);
}

export function notFound(res: Response, message = 'not_found') {
    sendResponse(res, 404, {
        message
    });
}
export function validationError(
    res: Response,
    errors: string[] | Record<string, string[]>
) {
    sendResponse(res, 422, {
        message: 'Validation error',
        errors
    });
}

export function badRequest(res: Response, error = 'bad_request') {
    sendResponse(res, 400, {
        error
    });
}

export function unauthorized(res: Response, error = 'unauthorized') {
    sendResponse(res, 401, {
        error
    });
}

export function forbidden(res: Response, error = 'forbidden') {
    sendResponse(res, 403, {
        error
    });
}
