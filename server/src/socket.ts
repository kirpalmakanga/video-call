import type { Server } from 'http';
import {
    Server as SocketServer,
    type ServerOptions as SocketServerOptions
} from 'socket.io';
import {
    addParticipantToRoom,
    areParticipantsInRoom,
    getAllRooms,
    getParticipantsForRoom,
    isParticipantInRoom,
    removeParticipantFromRoom,
    updateRoomParticipant
} from './rooms';

export default function startSocketServer(
    httpServer: Server,
    socketOptions: Partial<SocketServerOptions>
) {
    const io = new SocketServer(httpServer, socketOptions);

    function syncRoomsList() {
        io.sockets.emit('roomsListSync', {
            items: getAllRooms()
        });
    }

    function syncRoomParticipants(roomId: string) {
        io.in(roomId).emit('participantsListUpdated', {
            participants: getParticipantsForRoom(roomId)
        });
    }

    io.on('connection', (socket) => {
        function removeParticipant(participantId: string, roomId: string) {
            socket.leave(roomId);
            socket.leave(`${roomId}_${participantId}`);

            removeParticipantFromRoom(participantId, roomId);

            syncRoomsList();

            socket
                .to(roomId)
                .emit('participantDisconnected', { participantId });
        }

        socket.on(
            'connectParticipant',
            async ({
                roomId,
                participant
            }: {
                roomId: string;
                participant: Participant;
            }) => {
                if (!isParticipantInRoom(participant.id, roomId)) {
                    await Promise.all([
                        socket.join(roomId),
                        socket.join(`${roomId}_${participant.id}`)
                    ]);

                    addParticipantToRoom(participant, roomId);

                    syncRoomParticipants(roomId);

                    syncRoomsList();

                    socket.on('disconnect', () => {
                        removeParticipant(participant.id, roomId);
                    });
                }

                socket.to(roomId).emit('participantConnected', {
                    roomId,
                    senderParticipantId: participant.id
                });
            }
        );

        socket.on(
            'disconnectParticipant',
            ({
                roomId,
                participantId
            }: {
                roomId: string;
                participantId: string;
            }) => {
                removeParticipant(participantId, roomId);

                socket.removeAllListeners('disconnect');
            }
        );

        socket.on(
            'offer',
            (event: {
                roomId: string;
                senderParticipantId: string;
                targetParticipantId: string;
                offer: RTCSessionDescriptionInit;
            }) => {
                if (
                    areParticipantsInRoom(
                        [event.senderParticipantId, event.targetParticipantId],
                        event.roomId
                    )
                ) {
                    socket
                        .to(`${event.roomId}_${event.targetParticipantId}`)
                        .emit('incomingOffer', event);
                }
            }
        );

        socket.on(
            'answer',
            (event: {
                roomId: string;
                senderParticipantId: string;
                targetParticipantId: string;
                answer: RTCSessionDescriptionInit;
            }) => {
                if (
                    areParticipantsInRoom(
                        [event.senderParticipantId, event.targetParticipantId],
                        event.roomId
                    )
                ) {
                    socket
                        .to(`${event.roomId}_${event.targetParticipantId}`)
                        .emit('incomingAnswer', event);
                }
            }
        );

        socket.on(
            'iceCandidate',
            (event: {
                senderParticipantId: string;
                targetParticipantId: string;
                roomId: string;
                sdpMLineIndex: number;
                candidate: string;
            }) => {
                if (
                    areParticipantsInRoom(
                        [event.senderParticipantId, event.targetParticipantId],
                        event.roomId
                    )
                ) {
                    socket
                        .to(`${event.roomId}_${event.targetParticipantId}`)
                        .emit('incomingIceCandidate', event);
                }
            }
        );

        socket.on(
            'updateParticipant',
            ({
                roomId,
                senderParticipantId,
                data
            }: {
                roomId: string;
                senderParticipantId: string;
                data: Omit<Partial<ClientParticipant>, 'stream'>;
            }) => {
                if (isParticipantInRoom(senderParticipantId, roomId)) {
                    updateRoomParticipant(senderParticipantId, roomId, data);

                    syncRoomParticipants(roomId);
                }
            }
        );
    });
}
