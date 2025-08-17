import { handleCors, type H3Event } from 'h3';

const { CLIENT_URI } = process.env;

export function useCors() {
    return (event: H3Event) => {
        const corsResponse = handleCors(event, {
            origin: [CLIENT_URI as string],
            preflight: {
                statusCode: 204
            },
            methods: '*'
        });

        if (typeof corsResponse === 'string') {
            return corsResponse;
        }
    };
}
