import type { Request, RequestHandler } from 'express';
import { object, type AnySchema, ValidationError } from 'yup';
import { validationError } from '../utils/response.utils';

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
            if (error instanceof ValidationError) {
                return validationError(res, error.errors);
            }

            next(error);
        }
    };
}
