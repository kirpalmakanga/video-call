import express from 'express';
import listRoutes from 'express-list-routes';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './routes/auth';
import { errorHandler, notFound } from './middlewares';
import startSocket from './socket';

const { PORT, CLIENT_URI } = process.env;

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(helmet());
app.use(
    cors({
        origin: [CLIENT_URI as string]
    })
);

app.use('/auth', authRoutes);

app.use(notFound);
app.use(errorHandler);

listRoutes(app);

const server = app.listen(PORT, () => {
    console.log(`Listening: http://localhost:${PORT}`);
});

// startSocket(server, {
//     cors: {
//         origin: CLIENT_URI
//     }
// });
