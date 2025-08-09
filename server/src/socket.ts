import type { Server } from 'http';
import {
    Socket,
    Server as SocketServer,
    type ExtendedError,
    type ServerOptions as SocketServerOptions
} from 'socket.io';
import { type AnySchema } from 'yup';
import { authenticate, getUserIdFromToken } from './utils/jwt';
import { assertIsDefined } from '../../utils/assert';
import { connectedParticipantSchema } from './validation/socket';

const { NODE_ENV } = process.env;

function getSocketAuthToken(socket: Socket): string | undefined {
    return socket.handshake.auth.token;
}

async function authorizeSocket(
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

// function createEventHandler<T>(
//     socket: Socket,
//     {
//         event,
//         schema,
//         callback
//     }: { event: string; schema: AnySchema; callback: (payload: T) => void }
// ) {
//     return socket.on(event, async (payload: T) => {
//         try {
//             await schema.validate(payload);

//             callback(payload);
//         } catch (error) {
//             socket.emit('error', {
//                 event,
//                 error: error.message,
//                 ...(NODE_ENV !== 'production' && { stack: error.stack })
//             });
//         }
//     });
// }

export default function startSocketServer(
    httpServer: Server,
    socketOptions: Partial<SocketServerOptions>
) {
    const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(
        httpServer,
        socketOptions
    );

    io.use(authorizeSocket);

    io.on('connection', async (socket) => {
        const token = getSocketAuthToken(socket);

        assertIsDefined(token);

        const userId = await getUserIdFromToken(token);

        // createEventHandler(socket, {
        //     event: 'connectParticipant',
        //     schema: connectedParticipantSchema,
        //     async callback({ roomId, participant }) {}
        // });

        socket.on('connectParticipant', async ({ roomId, participant }) => {
            await Promise.all([
                socket.join(`room:${roomId}`),
                socket.join(`participant:${participant.id}:room:${roomId}`)
            ]);

            socket.once('disconnect', () => {
                socket.to(`room:${roomId}`).emit('participantDisconnected', {
                    participantId: participant.id
                });
            });

            socket.emit('connectedToRoom');

            socket.to(`room:${roomId}`).emit('participantConnected', {
                participantId: participant.id
            });
        });

        socket.on(
            'disconnectParticipant',
            async ({ roomId, participantId }) => {
                await Promise.all([
                    socket.leave(`room:${roomId}`),
                    socket.leave(`participant:${participantId}:room:${roomId}`)
                ]);

                socket.to(`room:${roomId}`).emit('participantDisconnected', {
                    participantId
                });
            }
        );

        socket.on('offer', async ({ roomId, targetParticipantId, ...data }) => {
            socket
                .to(`participant:${targetParticipantId}:room:${roomId}`)
                .emit('incomingOffer', data);
        });

        socket.on(
            'answer',
            async ({ roomId, targetParticipantId, ...data }) => {
                socket
                    .to(`participant:${targetParticipantId}:room:${roomId}`)
                    .emit('incomingAnswer', data);
            }
        );

        socket.on(
            'iceCandidate',
            async ({ roomId, targetParticipantId, ...data }) => {
                socket
                    .to(`participant:${targetParticipantId}:room:${roomId}`)
                    .emit('incomingIceCandidate', data);
            }
        );

        socket.on('syncParticipant', async ({ roomId, participant }) => {
            socket.to(`room:${roomId}`).emit('participantSynced', participant);
        });
    });
}
