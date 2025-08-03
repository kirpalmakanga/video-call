const { db } = require('../../utils/db');

export function getAllRooms() {
    return db.room.findMany();
}

export function createRoom(data: { name: string; creatorId: string }) {
    return db.room.create({ data });
}

export function updateRoom(id: string, data: { name: string }) {
    return db.room.update({ where: { id }, data });
}

export function getRoomById(id: string) {
    return db.room.findUnique({
        where: {
            id
        }
    });
}
