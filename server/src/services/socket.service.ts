import type { Message, Peer } from 'crossws';
import { getUrlParams } from '../utils/helpers.utils';
import { authenticate } from '../utils/jwt.utils';

export async function authenticatePeer(peer: Peer) {
    try {
        const { token } = getUrlParams(peer.request.url);

        if (token) {
            await authenticate(token);
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        peer.send({
            event: 'unauthorized',
        });

        peer.terminate();

        throw error;
    }
}

export function parseMessage<E extends ClientToServerEventId>(
    message: Message
): { event: E; payload: ClientToServerEventPayload<E> } {
    return message.json();
}
