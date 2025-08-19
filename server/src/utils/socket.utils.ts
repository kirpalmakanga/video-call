import { type AnySchema, ValidationError } from 'yup';
import { authenticate } from './jwt.utils';
import type { Peer } from 'crossws';

// export function getSocketAuthToken(socket: Socket): string | undefined {
//     return socket.handshake.auth.token;
// }

// export async function authorizeSocket(
//     socket: Socket,
//     next: (err?: ExtendedError) => void
// ) {
//     try {
//         const token = getSocketAuthToken(socket);

//         if (!token) {
//             throw new Error('unauthorized');
//         }

//         await authenticate(socket.handshake.auth.token);

//         next();
//     } catch (error) {
//         next(new Error('unauthorized'));
//     }
// }

// export function createEventHandler<E extends ClientToServerEventId>({
//     callback,
//     validation
// }: {
//     callback: (payload: ClientToServerEventPayload<E>, peer: Peer) => void;
//     validation?: AnySchema;
// }) {
//     return async (payload: any, peer: Peer) => {
//         if (validation) {
//             try {
//                 await validation.validate(payload);

//                 callback(payload, peer);
//             } catch (error) {
//                 console.error(error);
//             }
//         } else {
//             callback(payload, peer);
//         }
//     };
// }
