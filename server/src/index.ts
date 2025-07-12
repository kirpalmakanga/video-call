import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';

const { PORT, CLIENT_URI } = process.env;

const app = express();

app.use(
    cors({
        origin: [CLIENT_URI as string]
    })
);

const server = app.listen(PORT, () => console.log(`Listening on ${PORT}`));

const io = new Server(server, {
    cors: {
        origin: CLIENT_URI
    }
});

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

function updateRoomUser(userId: string, roomId: string, data: Partial<User>) {
    const users = [...getUsersForRoom(roomId)];
    const index = users.findIndex(({ id }) => id === userId);

    if (index === -1) {
        return;
    }

    const { [index]: user } = users;

    if (user) {
        users.splice(index, 1, { ...user, ...data });

        usersByRoom.set(roomId, users);
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

io.on('connection', (socket) => {
    function syncRoomUsers(roomId: string) {
        io.in(roomId).emit('usersListUpdated', {
            users: getUsersForRoom(roomId)
        });
    }

    async function addUser(roomId: string, user: User) {
        await socket.join(roomId);

        addUserToRoom(user, roomId);

        syncRoomUsers(roomId);
    }

    function updateUser(userId: string, roomId: string, data: Partial<User>) {
        updateRoomUser(userId, roomId, data);

        syncRoomUsers(roomId);
    }

    async function removeUser(userId: string, roomId: string) {
        await socket.leave(roomId);

        removeUserFromRoom(userId, roomId);

        socket.to(roomId).emit('userDisconnected', { userId });
    }

    socket.on(
        'join',
        async ({ roomId, user }: { roomId: string; user: User }) => {
            const { id: userId } = user;

            if (!isUserInRoom(userId, roomId)) {
                addUser(roomId, user);

                socket.on('disconnect', () => {
                    removeUser(userId, roomId);
                });
            }
        }
    );

    socket.on(
        'leave',
        ({ roomId, userId }: { roomId: string; userId: string }) => {
            removeUser(userId, roomId);
        }
    );

    socket.on('call', (event: { roomId: string; senderUserId: string }) => {
        socket.to(event.roomId).emit('call', event);
    });

    socket.on(
        'offer',
        (event: {
            roomId: string;
            senderUserId: string;
            receiverUserId: string;
            offer: RTCSessionDescriptionInit;
        }) => {
            socket.to(event.roomId).emit('offer', event);
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
            socket.to(event.roomId).emit('answer', event);
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
            socket.to(event.roomId).emit('iceCandidate', event);
        }
    );

    socket.on(
        'toggleMicrophone',
        (event: { roomId: string; senderUserId: string; isMuted: boolean }) => {
            updateUser(event.senderUserId, event.roomId, {
                isMuted: event.isMuted
            });
        }
    );
});
