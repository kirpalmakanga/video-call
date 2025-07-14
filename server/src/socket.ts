import type { Server } from 'http';
import {
    Server as SocketServer,
    type ServerOptions as SocketServerOptions
} from 'socket.io';
import { update } from './utils';

export default function startSocketServer(
    httpServer: Server,
    socketOptions: Partial<SocketServerOptions>
) {
    const io = new SocketServer(httpServer, socketOptions);

    const usersByRoom = new Map<string, User[]>();

    function getUsersForRoom(roomId: string) {
        if (!usersByRoom.has(roomId)) {
            usersByRoom.set(roomId, []);
        }

        return usersByRoom.get(roomId) as User[];
    }

    function isUserInRoom(userId: string, roomId: string) {
        return getUsersForRoom(roomId).some(({ id }) => id === userId);
    }

    function addUserToRoom(user: User, roomId: string) {
        if (!isUserInRoom(user.id, roomId)) {
            usersByRoom.set(roomId, [...getUsersForRoom(roomId), user]);
        }
    }

    function updateRoomUser(
        userId: string,
        roomId: string,
        data: Partial<User>
    ) {
        if (isUserInRoom(userId, roomId)) {
            usersByRoom.set(
                roomId,
                update(getUsersForRoom(roomId), ({ id }) => id === userId, data)
            );
        }
    }

    function removeUserFromRoom(userId: string, roomId: string) {
        const users = getUsersForRoom(roomId);

        if (!isUserInRoom(userId, roomId)) {
            return;
        }

        const filtered = users.filter(({ id }) => id !== userId);

        if (filtered.length) {
            usersByRoom.set(roomId, filtered);
        } else {
            usersByRoom.delete(roomId);
        }
    }

    function syncRoomUsers(roomId: string) {
        io.in(roomId).emit('usersListUpdated', {
            users: getUsersForRoom(roomId)
        });
    }

    io.on('connection', (socket) => {
        async function addUser(roomId: string, user: User) {
            await socket.join(roomId);

            addUserToRoom(user, roomId);

            syncRoomUsers(roomId);
        }

        function updateUser(
            userId: string,
            roomId: string,
            data: Partial<User>
        ) {
            updateRoomUser(userId, roomId, data);

            syncRoomUsers(roomId);
        }

        function removeUser(userId: string, roomId: string) {
            socket.leave(roomId);

            removeUserFromRoom(userId, roomId);

            socket.to(roomId).emit('userDisconnected', { userId });
        }

        socket.on(
            'call',
            async ({ roomId, user }: { roomId: string; user: User }) => {
                if (!isUserInRoom(user.id, roomId)) {
                    await addUser(roomId, user);

                    socket.on('disconnect', () => {
                        removeUser(user.id, roomId);
                    });
                }

                socket.to(roomId).emit('incomingCall', {
                    roomId,
                    senderUserId: user.id
                });
            }
        );

        socket.on(
            'leaveRoom',
            ({ roomId, userId }: { roomId: string; userId: string }) => {
                removeUser(userId, roomId);
            }
        );

        socket.on(
            'offer',
            (event: {
                roomId: string;
                senderUserId: string;
                receiverUserId: string;
                offer: RTCSessionDescriptionInit;
            }) => {
                socket.to(event.roomId).emit('incomingOffer', event);
            }
        );

        socket.on(
            'answer',
            (event: {
                roomId: string;
                senderUserId: string;
                receiverUserId: string;
                answer: RTCSessionDescriptionInit;
            }) => {
                socket.to(event.roomId).emit('incomingAnswer', event);
            }
        );

        socket.on(
            'iceCandidate',
            (event: {
                senderUserId: string;
                remotePeerId: string;
                roomId: string;
                sdpMLineIndex: number;
                candidate: string;
            }) => {
                socket.to(event.roomId).emit('incomingIceCandidate', event);
            }
        );

        socket.on(
            'updateUser',
            ({
                roomId,
                senderUserId,
                data
            }: {
                roomId: string;
                senderUserId: string;
                data: Omit<Partial<ClientUser>, 'stream'>;
            }) => {
                updateUser(senderUserId, roomId, data);
            }
        );
    });
}
