import express from 'express';
import listRoutes from 'express-list-routes';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import authRouter from '../routes/auth.routes';
import usersRouter from '../routes/users.routes';
import roomsRouter from '../routes/rooms.routes';
import { errorHandler, notFound } from './middlewares/errors.middleware';
import startSocket from '../socket';

const { PORT, CLIENT_URI } = process.env;

const corsOptions = { origin: [CLIENT_URI as string] };

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());
app.use(cors(corsOptions));

app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/rooms', roomsRouter);

app.use(notFound);
app.use(errorHandler);

listRoutes(app);

const server = app.listen(PORT, () => {
    console.log(`Listening: http://localhost:${PORT}`);
});

startSocket(server, {
    cors: corsOptions
});
