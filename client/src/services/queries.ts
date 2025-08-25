import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import {
    createRoom,
    getAllRooms,
    getCreatedRooms,
    getFavoriteRooms,
    getRoomById,
    toggleFavoriteRoom
} from './api';

const queryCache = useQueryCache();

export function useRoomQuery(roomId: string) {
    return useQuery({
        key: () => ['room', roomId],
        query: () => getRoomById(roomId),
        staleTime: undefined
    });
}

export function useAllRoomsQuery() {
    return useQuery({
        key: () => ['rooms'],
        query: getAllRooms
    });
}

export function useCreatedRoomsQuery() {
    return useQuery({
        key: () => ['rooms', 'created'],
        query: getCreatedRooms
    });
}

export function useFavoriteRoomsQuery() {
    return useQuery({
        key: () => ['rooms', 'favorite'],
        query: getFavoriteRooms
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

export function usetoggleFavoriteRoomMutation() {
    return useMutation({
        mutation: (roomId: string) => toggleFavoriteRoom(roomId),
        onSettled: async () => {
            await Promise.all([
                queryCache.invalidateQueries({
                    key: ['rooms'],
                    exact: true
                }),
                queryCache.invalidateQueries({
                    key: ['rooms', 'favorite'],
                    exact: true
                })
            ]);
        }
    });
}
