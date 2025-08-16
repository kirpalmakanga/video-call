import { getRouterParams, type H3Event } from 'h3';
import {
    createRoom,
    getAllRooms,
    getRoomById,
    updateRoom
} from '../services/rooms.service';
import { notFound } from '../utils/response.utils';

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
    const body = await event.req.json();
    const room = await createRoom({
        ...body,
        creatorId
    });

    return room;
}

interface UpdateRoomRequest {
    params: { roomId: string };
    body: { name: string };
}

export async function update(event: H3Event<UpdateRoomRequest>) {
    const { roomId } = getRouterParams(event);

    const body = await event.req.json();
    const updatedRoom = await updateRoom(
        { id: roomId as string, creatorId },
        body
    );

    return updatedRoom;
}
