import { Router, type Request } from 'express';
import { createRoom, getAllRooms, getRoomById } from './rooms.services';
import { isAuthenticated } from '../../middlewares';

const router = Router();

type CreateRoomBody = { name: string };

router.post(
    '/',
    isAuthenticated,
    async (
        {
            userId: creatorId,
            body: { name }
        }: Request<{}, { userId: string }, CreateRoomBody>,
        res
    ) => {
        const room = createRoom({
            name,
            creatorId
        });

        res.status(200).json();
    }
);

router.get('/', isAuthenticated, (_, res) => {
    res.json(getAllRooms());
});

router.get('/:roomId', isAuthenticated, async ({ params: { roomId } }, res) => {
    const room = await getRoomById(roomId as string);

    if (room) {
        return res.json(room);
    }

    res.status(404).json(null);
});

export default router;
