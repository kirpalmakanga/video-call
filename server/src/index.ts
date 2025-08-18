import { H3, serve } from 'h3';
import { useCors } from './middlewares/cors.middleware';
import {
    useRequestLogger,
    useErrorLogger,
    useResponseLogger
} from './middlewares/loggers.middleware';
import { useAuthentication } from './middlewares/auth.middleware';
import useAuthRoutes from './routes/auth.routes';
import useRoomsRoutes from './routes/rooms.routes';
import useUsersRoutes from './routes/users.routes';
import { useSocketPlugin, useSocketHandler } from './socket';
const { PORT, CLIENT_URI } = process.env;

const app = new H3();

useCors(app, {
    origin: [CLIENT_URI]
});

app.use(useRequestLogger());

app.use(useResponseLogger());

app.use(useErrorLogger());

app.use(useAuthentication());

useAuthRoutes(app);
useUsersRoutes(app);
useRoomsRoutes(app);
useSocketHandler(app);

serve(app, {
    port: PORT,
    plugins: [useSocketPlugin(app)]
});
