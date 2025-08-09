import type { Request, RequestHandler } from 'express';
import { object, type AnySchema, ValidationError } from 'yup';

type ValidateOptions = {
    [key in keyof Request]?: AnySchema;
};

export function validateRequest(options: ValidateOptions): RequestHandler {
    return async (req, res, next) => {
        try {
            if (!Object.keys(options).length) {
                throw new Error('Invalid request validation schema.');
            }

            await object(options).validate(req, {
                strict: true,
                abortEarly: false
            });

            next();
        } catch (error) {
            res.status(400).json({
                ...(error instanceof Error && {
                    error: error.message,
                    ...(process.env.NODE_ENV !== 'production' && {
                        stack: error.stack
                    })
                }),
                ...(error instanceof ValidationError && {
                    errors: error.errors
                })
            });
        }
    };
}
