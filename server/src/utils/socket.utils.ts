import type { ExtendedError, Socket } from 'socket.io';
import { type AnySchema, ValidationError } from 'yup';
import { authenticate } from './jwt.utils';

export function getSocketAuthToken(socket: Socket): string | undefined {
    return socket.handshake.auth.token;
}

export async function authorizeSocket(
    socket: Socket,
    next: (err?: ExtendedError) => void
) {
    try {
        const token = getSocketAuthToken(socket);

        if (!token) {
            throw new Error('unauthorized');
        }

        await authenticate(socket.handshake.auth.token);

        next();
    } catch (error) {
        next(new Error('unauthorized'));
    }
}

export function bindEvent<E extends ClientToServerEventId>(
    socket: Socket,
    {
        event,
        callback,
        validation
    }: {
        event: E;
        callback: ClientToServerEvents[E];
        validation?: AnySchema;
    }
) {
    socket.on(event, ((payload: any) => {
        (async () => {
            if (validation) {
                try {
                    await validation.validate(payload);

                    callback(payload);
                } catch (error) {
                    socket.emit('error', {
                        ...(error instanceof Error && {
                            error: error.message,
                            ...(process.env.NODE_ENV !== 'production' && {
                                stack: error.stack
                            })
                        }),
                        ...(error instanceof ValidationError && {
                            errors: error.errors
                        })
                    });
                }
            } else {
                callback(payload);
            }
        })();
    }) as any);
}

export async function joinRooms(socket: Socket, roomIds: string[]) {
    await Promise.all(roomIds.map((id) => socket.join(id)));
}

export async function leaveRooms(socket: Socket, roomIds: string[]) {
    await Promise.all(roomIds.map((id) => socket.leave(id)));
}

export function emit<E extends ServerToClientEventId>(
    socket: Socket,
    {
        event,
        roomId,
        payload
    }: { event: E; payload: ServerToClientEventPayload<E>; roomId?: string }
) {
    if (roomId) {
        socket.to(roomId).emit(event, payload);
    } else {
        socket.emit(event, payload);
    }
}
