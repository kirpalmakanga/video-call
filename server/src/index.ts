import { defineWebSocketHandler, H3, serve } from 'h3';
import { plugin as ws } from 'crossws/server';
import { useCors } from './middlewares/cors.middleware';
import {
    useRequestLogger,
    useErrorLogger
} from './middlewares/loggers.middleware';
import { useAuthentication } from './middlewares/auth.middleware';
import useAuthRoutes from './routes/auth.routes';
import useRoomsRoutes from './routes/rooms.routes';
import useUsersRoutes from './routes/users.routes';
import { useSocketHandler } from './socket';
const { PORT, CLIENT_URI } = process.env;

const app = new H3();

useCors(app, {
    origin: [CLIENT_URI]
});

app.use(useRequestLogger());

app.use(useErrorLogger());

app.use(useAuthentication());

useAuthRoutes(app);
useUsersRoutes(app);
useRoomsRoutes(app);
// useSocketHandler(app);

// app.get('/_ws', defineWebSocketHandler({ message: console.log }));

serve(app, {
    port: PORT
    // plugins: [
    //     ws({
    //         resolve: async (req) => (await app.fetch(req)).crossws
    //     })
    // ]
});
