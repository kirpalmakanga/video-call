import { defineWebSocketHandler, H3, onError, onResponse, serve } from 'h3';
import { plugin as ws } from 'crossws/server';
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
import { useSocketHandler } from './socket';
const { PORT } = process.env;

const app = new H3();

app.use(useRequestLogger());

app.use(useErrorLogger());

app.use(useResponseLogger());

app.use(useCors());

app.use(useAuthentication());

useAuthRoutes(app);
useUsersRoutes(app);
useRoomsRoutes(app);

app.use(
    onResponse((response) => {
        console.log(response.headers);
    })
);
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
