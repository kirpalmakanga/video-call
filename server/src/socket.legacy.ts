// import {
//     answerSchema,
//     connectedParticipantSchema,
//     disconnectParticipantSchema,
//     iceCandidateSchema,
//     offerSchema,
//     syncParticipantSchema
// } from './validation/socket.validation';
// import {
//     authorizeSocket,
//     bindEvent,
//     emit,
//     getSocketAuthToken,
//     joinRooms,
//     leaveRooms
// } from './utils/socket.utils';
// import { assertIsDefined } from '../../utils/assert';

// export default function startSocketServer(
//     httpServer: Server,
//     socketOptions: Partial<SocketServerOptions>
// ) {
//     const io = new SocketServer<ClientToServerEvents, ServerToClientEvents>(
//         httpServer,
//         socketOptions
//     );

//     io.use(authorizeSocket);

//     io.on('connection', async (socket) => {
//         const token = getSocketAuthToken(socket);

//         assertIsDefined(token);

//         // const userId = await getUserIdFromToken(token);

//         // bindEvent(socket, {
//         //     event: 'disconnect',
//         //     callback() {
//         //         for (const roomId of socket.rooms) {
//         //             if (roomId.startsWith('room:')) {
//         //                 emit(socket, {
//         //                     event: 'participantDisconnected',
//         //                     roomId,
//         //                     payload: {
//         //                         participantId: participant.id
//         //                     }
//         //                 });
//         //             }
//         //         }
//         //     }
//         // });

//         bindEvent(socket, {
//             event: 'connectParticipant',
//             validation: connectedParticipantSchema,
//             async callback({ roomId, participant }) {
//                 await joinRooms(socket, [
//                     `room:${roomId}`,
//                     `participant:${participant.id}:room:${roomId}`
//                 ]);

//                 socket.once('disconnect', () => {
//                     emit(socket, {
//                         event: 'participantDisconnected',
//                         roomId: `room:${roomId}`,
//                         payload: {
//                             participantId: participant.id
//                         }
//                     });
//                 });

//                 socket.emit('connectedToRoom');

//                 emit(socket, {
//                     event: 'participantConnected',
//                     roomId: `room:${roomId}`,
//                     payload: { participantId: participant.id }
//                 });
//             }
//         });

//         bindEvent(socket, {
//             event: 'disconnectParticipant',
//             validation: disconnectParticipantSchema,
//             async callback({ roomId, participantId }) {
//                 await leaveRooms(socket, [
//                     `room:${roomId}`,
//                     `participant:${participantId}:room:${roomId}`
//                 ]);

//                 emit(socket, {
//                     event: 'participantDisconnected',
//                     roomId: `room:${roomId}`,
//                     payload: {
//                         participantId
//                     }
//                 });
//             }
//         });

//         bindEvent(socket, {
//             event: 'offer',
//             validation: offerSchema,
//             callback({ roomId, targetParticipantId, ...payload }) {
//                 emit(socket, {
//                     event: 'incomingOffer',
//                     roomId: `participant:${targetParticipantId}:room:${roomId}`,
//                     payload
//                 });
//             }
//         });

//         bindEvent(socket, {
//             event: 'answer',
//             validation: answerSchema,
//             callback({ roomId, targetParticipantId, ...payload }) {
//                 emit(socket, {
//                     event: 'incomingAnswer',
//                     roomId: `participant:${targetParticipantId}:room:${roomId}`,
//                     payload
//                 });
//             }
//         });

//         bindEvent(socket, {
//             event: 'iceCandidate',
//             validation: iceCandidateSchema,
//             callback({ roomId, targetParticipantId, ...payload }) {
//                 emit(socket, {
//                     event: 'incomingIceCandidate',
//                     roomId: `participant:${targetParticipantId}:room:${roomId}`,
//                     payload
//                 });
//             }
//         });

//         bindEvent(socket, {
//             event: 'syncParticipant',
//             validation: syncParticipantSchema,
//             callback({ roomId, participant: payload }) {
//                 emit(socket, {
//                     event: 'participantSynced',
//                     roomId: `room:${roomId}`,
//                     payload
//                 });
//             }
//         });
//     });
// }
