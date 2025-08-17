import { H3, serve } from 'h3';
import { useCors } from './middlewares/cors.middleware';
import {
    useRequestErrorLogger,
    useRequestLogger
} from './middlewares/loggers.middleware';
import { useAuthentication } from './middlewares/auth.middleware';
import useAuthRoutes from './routes/auth.routes';
import useRoomsRoutes from './routes/rooms.routes';
import useUsersRoutes from './routes/users.routes';

const { PORT } = process.env;

const app = new H3();

app.use(useRequestLogger());

app.use(useRequestErrorLogger());

app.use(useCors());

app.use(useAuthentication());

useAuthRoutes(app);
useUsersRoutes(app);
useRoomsRoutes(app);

serve(app, { port: PORT });
