import db from '../db';

export function createRoom(data: { name: string; creatorId: string }) {
    return db.room.create({ data });
}

export function updateRoom(
    where: { id: string; creatorId: string },
    data: { name: string }
) {
    return db.room.update({ where: where, data });
}

export function getAllRooms() {
    return db.room.findMany();
}

export function getRoomById(id: string) {
    return db.room.findUnique({
        where: {
            id
        }
    });
}
