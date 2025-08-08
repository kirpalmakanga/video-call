import type { Server } from 'http';
import {
    Socket,
    Server as SocketServer,
    type ServerOptions as SocketServerOptions
} from 'socket.io';
import { authenticate, getUserIdFromToken } from './utils/jwt';
import { assertIsDefined } from '../../utils/assert';

function getAccessToken(socket: Socket): string | undefined {
    return socket.handshake.auth.token;
}

export default function startSocketServer(
    httpServer: Server,
    socketOptions: Partial<SocketServerOptions>
) {
    const io = new SocketServer(httpServer, socketOptions);

    io.use(async (socket, next) => {
        try {
            const token = getAccessToken(socket);

            if (!token) {
                throw new Error('unauthorized');
            }

            await authenticate(socket.handshake.auth.token);

            next();
        } catch (error) {
            next(new Error('unauthorized'));
        }
    });

    io.on('connection', async (socket) => {
        const token = getAccessToken(socket);

        assertIsDefined(token);

        const userId = await getUserIdFromToken(token);

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
                    socket.join(`room:${roomId}`),
                    socket.join(`participant:${participant.id}:room:${roomId}`)
                ]);

                socket.once('disconnect', () => {
                    socket
                        .to(`room:${roomId}`)
                        .emit('participantDisconnected', {
                            participantId: participant.id
                        });
                });

                socket.emit('connectedToRoom');

                socket.to(`room:${roomId}`).emit('participantConnected', {
                    participantId: participant.id
                });
            }
        );

        socket.on(
            'disconnectParticipant',
            async ({
                roomId,
                participantId
            }: {
                roomId: string;
                participantId: string;
            }) => {
                await Promise.all([
                    socket.leave(`room:${roomId}`),
                    socket.leave(`participant:${participantId}:room:${roomId}`)
                ]);

                socket.to(`room:${roomId}`).emit('participantDisconnected', {
                    participantId
                });
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
                    .to(`participant:${targetParticipantId}:room:${roomId}`)
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
                    .to(`participant:${targetParticipantId}:room:${roomId}`)
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
                    .to(`participant:${targetParticipantId}:room:${roomId}`)
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
                    .to(`room:${roomId}`)
                    .emit('participantSynced', { participant });
            }
        );
    });
}
