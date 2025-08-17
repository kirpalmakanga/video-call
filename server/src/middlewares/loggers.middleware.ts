import { onError, onRequest } from 'h3';

export function useRequestLogger() {
    return onRequest((event) => {
        console.log(`[${event.req.method}] ${event.url.pathname}`);
    });
}

export function useRequestErrorLogger() {
    return onError((error, event) => {
        console.error(
            `[${event.req.method}] ${event.url.pathname} !! ${error.message}`
        );

        if (process.env.NODE_ENV !== 'production') {
            console.error(error.stack);
        }
    });
}
