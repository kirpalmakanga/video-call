import { definePlugin, onError, onRequest } from 'h3';
import { isProduction } from '../utils/helpers.utils';

interface LoggerOptions {
    requests?: boolean;
    errors?: boolean;
}

export const logger = definePlugin((app, options?: LoggerOptions) => {
    const { requests = true, errors = true } = options || {};

    if (requests) {
        app.use(
            onRequest((event) => {
                console.log(`[${event.req.method}] ${event.url.pathname}`);
            })
        );
    }

    if (errors) {
        app.use(
            onError((error, event) => {
                console.error(
                    `[${event.req.method}] ${event.url.pathname} !! ${error.message}`
                );

                if (!isProduction()) {
                    console.error(error.stack);
                }
            })
        );
    }
});
