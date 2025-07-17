import express from 'express';
import cors from 'cors';
import startSocketServer from './socket';
import { getAllRooms } from './rooms';

const { PORT, CLIENT_URI } = process.env;

const app = express();

app.use(
    cors({
        origin: [CLIENT_URI as string]
    })
);

app.get('/rooms', (_, res) => {
    res.json(getAllRooms());
});

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

startSocketServer(server, {
    cors: {
        origin: CLIENT_URI
    }
});
