import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import { createRoom, getAllRooms, getRoomById } from './api';

const queryCache = useQueryCache();

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

export function useCreateRoomMutation() {
    return useMutation({
        mutation: (body: RoomFormData) => createRoom(body),
        onSettled: async () => {
            await queryCache.invalidateQueries({ key: ['rooms'], exact: true });
        }
    });
}
