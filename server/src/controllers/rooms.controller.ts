import type { NextFunction, Request, Response } from 'express';
import {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom
} from '../services/rooms.service';
import { notFound, success } from '../utils/response';

export async function index(_: Request, res: Response, next: NextFunction) {
    try {
        const rooms = await getAllRooms();

        success(res, rooms);
    } catch (error) {
        next(error);
    }
}

export async function show(
    { params: { roomId } }: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const room = await getRoomById(roomId as string);

        if (room) {
            return success(res, room);
        }

        notFound(res, 'Room not found');
    } catch (error) {
        next(error);
    }
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

        success(res, room);
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
