import type { Server } from 'http';
import {
    Server as SocketServer,
    type ServerOptions as SocketServerOptions
} from 'socket.io';
import { getUserIdForToken } from './utils/jwt';
import { getUserById } from './services/users';

export default function startSocketServer(
    httpServer: Server,
    socketOptions: Partial<SocketServerOptions>
) {
    const io = new SocketServer(httpServer, socketOptions);

    io.on('connection', async (socket) => {
        try {
            const { token } = socket.handshake.auth;

            if (!token) {
                throw new Error('Unauthorized.');
            }

            const userId = getUserIdForToken(socket.handshake.auth.token);
            const user = await getUserById(userId);

            if (!user) {
                throw new Error('Unauthorized.');
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
                    await Promise.all([
                        socket.join(roomId),
                        socket.join(`${roomId}_${participant.id}`)
                    ]);
                    // if (!isParticipantInRoom(participant.id, roomId)) {

                    //     addParticipantToRoom(participant, roomId);

                    //     syncRoomParticipants(roomId);

                    //     syncRoomsList();

                    //     socket.on('disconnect', () => {
                    //         removeParticipant(participant.id, roomId);
                    //     });
                    // }

                    socket.to(roomId).emit('participantConnected', {
                        participant: {
                            id: user.id,
                            name: `${user.firstName} ${user.lastName}`
                        }
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
                    // removeParticipant(participantId, roomId);
                    // socket.removeAllListeners('disconnect');
                }
            );

            socket.on(
                'offer',
                async (event: {
                    roomId: string;
                    senderParticipantId: string;
                    targetParticipantId: string;
                    offer: RTCSessionDescriptionInit;
                }) => {
                    // if (
                    //     await areParticipantsInRoom(
                    //         [
                    //             event.senderParticipantId,
                    //             event.targetParticipantId
                    //         ],
                    //         event.roomId
                    //     )
                    // ) {
                    //     socket
                    //         .to(`${event.roomId}_${event.targetParticipantId}`)
                    //         .emit('incomingOffer', event);
                    // }
                }
            );

            socket.on(
                'answer',
                async (event: {
                    roomId: string;
                    senderParticipantId: string;
                    targetParticipantId: string;
                    answer: RTCSessionDescriptionInit;
                }) => {
                    // if (
                    //     await areParticipantsInRoom(
                    //         [
                    //             event.senderParticipantId,
                    //             event.targetParticipantId
                    //         ],
                    //         event.roomId
                    //     )
                    // ) {
                    //     socket
                    //         .to(`${event.roomId}_${event.targetParticipantId}`)
                    //         .emit('incomingAnswer', event);
                    // }
                }
            );

            socket.on(
                'iceCandidate',
                async (event: {
                    senderParticipantId: string;
                    targetParticipantId: string;
                    roomId: string;
                    sdpMLineIndex: number;
                    candidate: string;
                }) => {
                    // if (
                    //     await areParticipantsInRoom(
                    //         [
                    //             event.senderParticipantId,
                    //             event.targetParticipantId
                    //         ],
                    //         event.roomId
                    //     )
                    // ) {
                    //     socket
                    //         .to(`${event.roomId}_${event.targetParticipantId}`)
                    //         .emit('incomingIceCandidate', event);
                    // }
                }
            );

            socket.on(
                'updateParticipant',
                async ({
                    roomId,
                    senderParticipantId,
                    data
                }: {
                    roomId: string;
                    senderParticipantId: string;
                    data: Omit<Partial<ClientParticipant>, 'stream'>;
                }) => {
                    // if (
                    //     await isParticipantInRoom(senderParticipantId, roomId)
                    // ) {
                    //     updateRoomParticipant(
                    //         senderParticipantId,
                    //         roomId,
                    //         data
                    //     );
                    //     syncRoomParticipants(roomId);
                    // }
                }
            );
        } catch (error) {
            socket.emit('connection:unauthorized');
        }
    });
}
