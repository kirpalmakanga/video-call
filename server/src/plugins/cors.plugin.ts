import { definePlugin, handleCors, onError, type CorsOptions, type H3Event } from 'h3';
import { mergeHeaders } from '../utils/helpers.utils';

const corsResponseHeaderKeys = [
    'access-control-allow-origin',
    'access-control-allow-credentials',
    'access-control-expose-headers',
    'vary',
    'origin'
];

function getCorsResponseHeaders(event: H3Event) {
    const headers = new Headers(
        [...event.res.headers.entries()].filter(([key]) => corsResponseHeaderKeys.includes(key))
    );
    return headers;
}

export const cors = definePlugin((app, options: CorsOptions) => {
    app.use((event: H3Event) => {
        if (event.req.headers.get('upgrade') === 'websocket') return;

        const corsResponse = handleCors(event, options);

        if (corsResponse) {
            return corsResponse;
        }
    });

    app.use(
        onError((error, event) => {
            return new Response(JSON.stringify(error.toJSON(), null, 2), {
                status: error.status,
                headers: mergeHeaders(getCorsResponseHeaders(event), {
                    'content-type': 'application/json;charset=UTF-8'
                })
            });
        })
    );
});
