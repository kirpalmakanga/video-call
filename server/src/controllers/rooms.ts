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

type CreateRoomBody = { name: string };

export async function insert(
    {
        userId: creatorId,
        body: { name }
    }: Request<{}, { userId: string }, CreateRoomBody>,
    res: Response
) {
    const room = await createRoom({
        name,
        creatorId
    });

    res.status(200).json();
}

export async function update(
    {
        userId: creatorId,
        params: { roomId },
        body
    }: Request<{}, { userId: string }, CreateRoomBody>,
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
