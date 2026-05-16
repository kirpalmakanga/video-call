import { useMutation, useQuery, useQueryCache } from '@pinia/colada';
import {
    createRoom,
    getAllRooms,
    getCreatedRooms,
    getFavoriteRooms,
    getRoomById,
    toggleFavoriteRoom
} from './api';
import { AxiosError } from 'axios';

const queryCache = useQueryCache();

export function useRoomQuery(roomId: string) {
    return useQuery({
        key: () => ['room', roomId],
        query: () => getRoomById(roomId),
        staleTime: undefined,
        refetchOnWindowFocus: undefined
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
    const toast = useToast();

    return useMutation({
        mutation: (body: RoomFormData) => createRoom(body),
        onSuccess({ name }) {
            toast.add({
                title: 'Success',
                description: `Created room: ${name}.`,
                color: 'success'
            });
        },
        onError(error) {
            toast.add({
                title: 'Failed to create room',
                description:
                    error instanceof AxiosError
                        ? error.response?.data.error
                        : `Couldn't create room, please try later.`,
                color: 'error'
            });
        },
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
