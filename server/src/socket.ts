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

    const participantsByRoom = new Map<string, Participant[]>();

    function getParticipantsForRoom(roomId: string) {
        if (!participantsByRoom.has(roomId)) {
            participantsByRoom.set(roomId, []);
        }

        return participantsByRoom.get(roomId) as Participant[];
    }

    function getParticipantIds(roomId: string) {
        return getParticipantsForRoom(roomId).map(({ id }) => id);
    }

    function isParticipantInRoom(participantId: string, roomId: string) {
        return getParticipantIds(roomId).includes(participantId);
    }

    function areParticipantsInRoom(participantIds: string[], roomId: string) {
        const roomParticipantIds = getParticipantIds(roomId);

        return participantIds.every((id) => roomParticipantIds.includes(id));
    }

    function addParticipantToRoom(participant: Participant, roomId: string) {
        if (!isParticipantInRoom(participant.id, roomId)) {
            participantsByRoom.set(roomId, [
                ...getParticipantsForRoom(roomId),
                participant
            ]);
        }
    }

    function updateRoomParticipant(
        participantId: string,
        roomId: string,
        data: Partial<Participant>
    ) {
        if (isParticipantInRoom(participantId, roomId)) {
            participantsByRoom.set(
                roomId,
                update(
                    getParticipantsForRoom(roomId),
                    ({ id }) => id === participantId,
                    data
                )
            );
        }
    }

    function removeParticipantFromRoom(participantId: string, roomId: string) {
        const participants = getParticipantsForRoom(roomId);

        if (!isParticipantInRoom(participantId, roomId)) {
            return;
        }

        const filtered = participants.filter(({ id }) => id !== participantId);

        if (filtered.length) {
            participantsByRoom.set(roomId, filtered);
        } else {
            participantsByRoom.delete(roomId);
        }
    }

    function syncRoomParticipants(roomId: string) {
        io.in(roomId).emit('participantsListUpdated', {
            participants: getParticipantsForRoom(roomId)
        });
    }

    io.on('connection', (socket) => {
        function removeParticipant(participantId: string, roomId: string) {
            socket.leave(roomId);

            removeParticipantFromRoom(participantId, roomId);

            socket
                .to(roomId)
                .emit('participantDisconnected', { participantId });
        }

        socket.on(
            'joinRoom',
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

                    socket.on('disconnect', () => {
                        removeParticipant(participant.id, roomId);
                    });
                }

                socket.to(roomId).emit('incomingCall', {
                    roomId,
                    senderParticipantId: participant.id
                });
            }
        );

        socket.on(
            'leaveRoom',
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
