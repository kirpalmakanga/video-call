import axios from 'axios';
import { useMutation, useQuery, useQueryCache } from '@pinia/colada';

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URI
});

export function useRoomsListQuery() {
    return useQuery({
        key: () => ['rooms'],
        query: async () => {
            const { data } = await axiosInstance.get('/rooms');

            return data as ClientRoom[];
        }
    });
}

export function useRoomQuery(roomId: string) {
    return useQuery({
        key: () => ['room', roomId],
        query: async () => {
            const { data } = await axiosInstance.get(`/rooms/${roomId}`);

            return data as ClientRoom[];
        }
    });
}
