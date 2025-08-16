import { H3, handleCors, serve } from 'h3';
import useAuthRoutes from './routes/auth.routes';

const { PORT, CLIENT_URI } = process.env;

const app = new H3();

// app.use(async (event, next) => {
//     const corsRes = handleCors(event, {
//         origin: [CLIENT_URI as string],
//         preflight: {
//             statusCode: 204
//         },
//         methods: '*'
//     });

//     return corsRes;
// });

useAuthRoutes(app);

serve(app, { port: PORT });
