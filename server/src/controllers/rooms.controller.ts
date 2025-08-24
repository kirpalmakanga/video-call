import {
    getRouterParams,
    getValidatedRouterParams,
    readValidatedBody,
    type H3Event
} from 'h3';
import {
    createRoom,
    updateRoom,
    getAllRooms,
    getRoomById,
    getUserCreatedRooms
} from '../services/rooms.service';
import { notFound } from '../utils/response.utils';
import {
    createRoomSchema,
    toggleFavoriteRoomSchema
} from '../validation/rooms.validation';
import {
    addFavorite,
    checkIfFavoriteExists,
    deleteFavorite,
    getUserFavoriteRooms,
    getUserFavorites
} from '../services/favorite.service';

export async function index(event: H3Event) {
    const { userId } = event.context;
    const favoriteRoomsIds = await getUserFavorites(userId);
    const rooms = await getAllRooms();

    return rooms.map((room) => ({
        ...room,
        isOwned: room.creator.id === userId,
        isFavorite: favoriteRoomsIds.includes(room.id)
    }));
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

export async function getCreated(event: H3Event) {
    const items = await getUserCreatedRooms(event.context.userId);

    return items.map((room) => ({ ...room, isOwned: true }));
}

export async function getFavorite(event: H3Event) {
    const items = await getUserFavoriteRooms(event.context.userId);

    return items.map(({ room }) => ({
        ...room,
        isFavorite: true
    }));
}

export async function toggleFavorite(event: H3Event) {
    const { userId } = event.context;
    const { roomId } = await getValidatedRouterParams(
        event,
        toggleFavoriteRoomSchema
    );

    const hasFavorite = await checkIfFavoriteExists(roomId, userId);

    if (hasFavorite) {
        await deleteFavorite(roomId, userId);
    } else {
        await addFavorite(roomId, userId);
    }
}
