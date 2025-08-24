import db from '../db';

export async function getUserFavorites(userId: string) {
    const items = await db.favorite.findMany({
        where: { userId }
    });

    return items.map(({ roomId }) => roomId);
}

export async function getUserFavoriteRooms(userId: string) {
    return db.favorite.findMany({
        where: { userId },
        select: {
            room: {
                select: {
                    id: true,
                    name: true,
                    creator: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }
        }
    });
}

export async function checkIfFavoriteExists(roomId: string, userId: string) {
    const count = await db.favorite.count({
        where: { roomId, userId }
    });

    return !!count;
}

export async function addFavorite(roomId: string, userId: string) {
    return db.favorite.create({ data: { roomId, userId } });
}

export async function deleteFavorite(roomId: string, userId: string) {
    return db.favorite.delete({ where: { roomId, userId } });
}
