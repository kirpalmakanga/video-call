import type { NextFunction, Request, Response } from 'express';
import {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom
} from '../services/rooms';

export async function index(_: Request, res: Response) {
    const rooms = await getAllRooms();

    res.json(rooms);
}

export async function show({ params: { roomId } }: Request, res: Response) {
    const room = await getRoomById(roomId as string);

    if (room) {
        return res.json(room);
    }

    res.status(404).json(null);
}

interface CreateRoomRequest extends AuthenticatedRequest {
    body: { name: string };
}

export async function insert(
    { userId: creatorId, body: { name } }: CreateRoomRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const room = await createRoom({
            name,
            creatorId
        });

        res.status(200).json(room);
    } catch (error) {
        next(error);
    }
}

interface UpdateRoomRequest extends CreateRoomRequest {
    params: { roomId: string };
}

export async function update(
    { userId: creatorId, params: { roomId }, body }: UpdateRoomRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const updatedRoom = await updateRoom({ id: roomId, creatorId }, body);

        res.status(200).json(updatedRoom);
    } catch (error) {
        next(error);
    }
}
