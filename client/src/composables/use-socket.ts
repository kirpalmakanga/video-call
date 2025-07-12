import { io } from 'socket.io-client';

export function useSocket() {
    const socket = io('https://api.video-call.dev');

    return {
        emit(event: string, data: unknown) {
            socket.emit(event, data);
        },
        listen<T>(event: string, callback: (payload: T) => void) {
            socket.on(event, callback);
        }
    };
}
