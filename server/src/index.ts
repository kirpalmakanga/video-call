import { H3, serve } from 'h3';
import { cors } from './plugins/cors.plugin';
import { logger } from './plugins/logger.plugin';
import { useAuthentication } from './middlewares/auth.middleware';
import useAuthRoutes from './routes/auth.routes';
import useRoomsRoutes from './routes/rooms.routes';
import useUsersRoutes from './routes/users.routes';
import { useSocketPlugin, useSocketHandler } from './socket';

const { PORT, CLIENT_URI } = process.env;

const app = new H3();

app.register(
    cors({
        origin: [CLIENT_URI],
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    })
);

app.register(
    logger({
        requests: true,
        errors: true
    })
);

app.use(useAuthentication());

useAuthRoutes(app);
useUsersRoutes(app);
useRoomsRoutes(app);
useSocketHandler(app);

serve(app, {
    port: PORT,
    plugins: [useSocketPlugin(app)]
});
