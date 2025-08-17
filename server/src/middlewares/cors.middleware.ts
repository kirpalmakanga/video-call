import { handleCors, type CorsOptions, type H3Event } from 'h3';

const { CLIENT_URI } = process.env;

const corsOptions: CorsOptions = {
    origin: [CLIENT_URI as string],
    preflight: {
        statusCode: 204
    },
    methods: '*'
};

export function useCors() {
    return (event: H3Event) => {
        const corsResponse = handleCors(event, corsOptions);

        if (typeof corsResponse === 'string') {
            return corsResponse;
        }
    };
}
