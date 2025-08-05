import type { Server } from 'http';
import {
    Server as SocketServer,
    type ServerOptions as SocketServerOptions
} from 'socket.io';
import { getUserFromToken } from './utils/jwt';

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

            const user = getUserFromToken(socket.handshake.auth.token);

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

                    socket.once('disconnect', () => {
                        socket.to(roomId).emit('participantDisconnected', {
                            participantId: participant.id
                        });
                    });

                    socket.to(roomId).emit('participantConnected', {
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
                    socket
                        .to(roomId)
                        .emit('participantDisconnected', { participantId });
                }
            );

            socket.on(
                'offer',
                async ({
                    roomId,
                    targetParticipantId,
                    ...data
                }: {
                    roomId: string;
                    senderParticipantId: string;
                    targetParticipantId: string;
                    offer: RTCSessionDescriptionInit;
                }) => {
                    socket
                        .to(`${roomId}_${targetParticipantId}`)
                        .emit('incomingOffer', data);
                }
            );

            socket.on(
                'answer',
                async ({
                    roomId,
                    targetParticipantId,
                    ...data
                }: {
                    roomId: string;
                    senderParticipantId: string;
                    targetParticipantId: string;
                    answer: RTCSessionDescriptionInit;
                }) => {
                    socket
                        .to(`${roomId}_${targetParticipantId}`)
                        .emit('incomingAnswer', data);
                }
            );

            socket.on(
                'iceCandidate',
                async ({
                    roomId,
                    targetParticipantId,
                    ...data
                }: {
                    roomId: string;
                    senderParticipantId: string;
                    targetParticipantId: string;
                    sdpMLineIndex: number;
                    candidate: string;
                }) => {
                    socket
                        .to(`${roomId}_${targetParticipantId}`)
                        .emit('incomingIceCandidate', data);
                }
            );

            socket.on(
                'syncParticipant',
                async ({
                    roomId,
                    participant
                }: {
                    roomId: string;
                    senderParticipantId: string;
                    participant: Omit<Partial<ClientParticipant>, 'stream'>;
                }) => {
                    socket
                        .to(roomId)
                        .emit('participantSynced', { participant });
                }
            );
        } catch (error) {
            console.error(error);

            socket.emit('connection:unauthorized');
        }
    });
}
