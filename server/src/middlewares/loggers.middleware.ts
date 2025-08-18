import { onError, onRequest, onResponse } from 'h3';
import { isProduction } from '../utils/helpers.utils';

export function useRequestLogger() {
    return onRequest((event) => {
        console.log(`[${event.req.method}] ${event.url.pathname}`);
    });
}

export function useErrorLogger() {
    return onError((error, event) => {
        console.error(
            `[${event.req.method}] ${event.url.pathname} !! ${error.message}`
        );

        if (!isProduction()) {
            console.error(error.stack);
        }
    });
}

export function useResponseLogger() {
    return onResponse((response) => {
        console.log(response);
    });
}
