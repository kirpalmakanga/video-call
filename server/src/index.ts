import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import startSocketServer from './socket';

const { PORT, CLIENT_URI } = process.env;

const app = express();

app.use(
    cors({
        origin: [CLIENT_URI as string]
    })
);

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

startSocketServer(server, {
    cors: {
        origin: CLIENT_URI
    }
});
