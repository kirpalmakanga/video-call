import { type H3Event } from 'h3';
import { type AnySchema, ValidationError } from 'yup';
import { serverError, validationError } from '../utils/response.utils';

export function validateBody(schema: AnySchema) {
    return async (event: H3Event) => {
        try {
            await schema.validate(await event.req.json(), {
                strict: true,
                abortEarly: false
            });
        } catch (error) {
            if (error instanceof ValidationError) {
                console.error(error);

                return validationError(error.errors);
            }

            serverError(error);
        }
    };
}
