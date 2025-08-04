import type { RequestHandler } from 'express';
import { type AnySchema } from 'yup';

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
