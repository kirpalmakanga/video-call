import { useQuery } from '@pinia/colada';
import { getAllRooms, getRoomById } from './api';

export function useRoomsListQuery() {
    return useQuery({
        key: () => ['rooms'],
        query: getAllRooms
    });
}

export function useRoomQuery(roomId: string) {
    return useQuery({
        key: () => ['room', roomId],
        query: () => getRoomById(roomId)
    });
}
