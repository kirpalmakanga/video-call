import express from 'express';
import cors from 'cors';
import startSocketServer from './socket';
import { getAllRooms, getRoomById } from './rooms';

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

app.get('/rooms/:id', ({ id }, res) => {
    const room = getRoomById(id);

    if (room) {
        return res.json(room);
    }

    res.status(404).json(null);
});

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

startSocketServer(server, {
    cors: {
        origin: CLIENT_URI
    }
});
