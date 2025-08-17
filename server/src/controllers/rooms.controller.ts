import { getRouterParams, readValidatedBody, type H3Event } from 'h3';
import {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom
} from '../services/rooms.service';
import { notFound } from '../utils/response.utils';
import { createRoomSchema } from '../validation/rooms.validation';

export async function index() {
    return await getAllRooms();
}

export async function show(event: H3Event) {
    const { roomId } = getRouterParams(event);
    const room = await getRoomById(roomId as string);

    if (room) {
        return room;
    }

    notFound('Room not found');
}

interface CreateRoomRequest {
    body: { name: string };
}

export async function insert(event: H3Event<CreateRoomRequest>) {
    const body = await readValidatedBody(event, createRoomSchema);

    const room = await createRoom({
        ...body,
        creatorId: event.context.userId
    });

    return room;
}

interface UpdateRoomRequest {
    body: { name: string };
}

export async function update(event: H3Event<UpdateRoomRequest>) {
    const { roomId } = getRouterParams(event);

    const body = await readValidatedBody(event, createRoomSchema);
    const updatedRoom = await updateRoom(
        { id: roomId as string, creatorId: event.context.userId },
        body
    );

    return updatedRoom;
}
