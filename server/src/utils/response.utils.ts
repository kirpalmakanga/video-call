import { HTTPError } from 'h3';

export function serverError(error: Error) {
    console.error(error);

    throw new HTTPError({
        status: 500,
        statusText: 'Server error',
        message: error.message,
        ...(process.env.NODE_ENV !== 'production' && {
            stack: error.stack
        })
    });
}

export function notFound(message?: string) {
    throw new HTTPError({
        status: 404,
        statusText: 'Not found',
        message
    });
}
export function validationError(errors: string[] | Record<string, string[]>) {
    throw new HTTPError({
        status: 422,
        statusText: 'Validation errors',
        body: { errors }
    });
}

export function badRequest(message?: string) {
    throw new HTTPError({
        status: 400,
        statusText: 'Bad Request',
        message
    });
}

export function unauthorized(message?: string) {
    throw new HTTPError({
        status: 401,
        statusText: 'Unauthorized',
        message
    });
}

export function forbidden(message?: string) {
    throw new HTTPError({
        status: 403,
        statusText: 'Forbidden',
        message
    });
}
