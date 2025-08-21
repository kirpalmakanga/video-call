import {
    handleCors,
    type H3,
    type CorsOptions,
    type H3Event,
    onError
} from 'h3';

const corsResponseHeaderKeys = [
    'access-control-allow-origin',
    'access-control-allow-credentials',
    'access-control-expose-headers',
    'vary',
    'origin'
];

function getCorsHeaders(event: H3Event) {
    const headers = new Headers(
        [...event.res.headers.entries()].filter(([key]) =>
            corsResponseHeaderKeys.includes(key)
        )
    );
    return headers;
}

export function useCors(app: H3, options: CorsOptions) {
    app.use((event: H3Event) => {
        if (event.req.headers.get('upgrade') === 'websocket') return;

        const corsResponse = handleCors(event, options);

        if (typeof corsResponse === 'string') {
            return corsResponse;
        }
    });

    app.use(
        onError((error, event) => {
            const headers = getCorsHeaders(event);

            headers.append('content-type', 'application/json;charset=UTF-8');

            return new Response(JSON.stringify(error.toJSON(), null, 2), {
                status: error.status,
                statusText: error.statusText,
                headers: headers
            });
        })
    );
}
