import { defineWebSocketHandler, type H3 } from 'h3';
import { plugin as ws } from 'crossws/server';
import type { Message, Peer } from 'crossws';
import { getUrlParams } from './utils/helpers.utils';
import { authenticate } from './utils/jwt.utils';

type EventHandlers = {
    [K in keyof ClientToServerEvents]: (
        payload: ClientToServerEventPayload<K>,
        peer: Peer
    ) => void;
};

const handlers: EventHandlers = {
    requestConnection({ roomId, participantId }, peer) {
        peer.context.participantId = participantId;

        peer.subscribe(`room:${roomId}`);
        peer.subscribe(`participant:${participantId}:room:${roomId}`);

        peer.send({
            event: 'connectionConfirmed',
            payload: { participantId }
        });
    },
    connectParticipant({ roomId, participantId }, peer) {
        peer.publish(`room:${roomId}`, {
            event: 'participantConnected',
            payload: { participantId }
        });
    },
    disconnectParticipant({ roomId, participantId }, peer) {
        peer.publish(`room:${roomId}`, {
            event: 'participantDisconnected',
            payload: { participantId }
        });

        peer.unsubscribe(`room:${roomId}`);
        peer.unsubscribe(`participant:${participantId}:room:${roomId}`);
    },
    offer({ roomId, participantId, targetParticipantId, ...payload }, peer) {
        peer.publish(`participant:${targetParticipantId}:room:${roomId}`, {
            event: 'incomingOffer',
            payload: {
                senderParticipantId: participantId,
                ...payload
            }
        });
    },
    answer({ roomId, participantId, targetParticipantId, ...payload }, peer) {
        peer.publish(`participant:${targetParticipantId}:room:${roomId}`, {
            event: 'incomingAnswer',
            payload: {
                senderParticipantId: participantId,
                ...payload
            }
        });
    },
    iceCandidate(
        { roomId, participantId, targetParticipantId, ...payload },
        peer
    ) {
        peer.publish(`participant:${targetParticipantId}:room:${roomId}`, {
            event: 'incomingIceCandidate',
            payload: {
                senderParticipantId: participantId,
                ...payload
            }
        });
    },
    syncParticipant({ roomId, participant: payload }, peer) {
        peer.publish(`room:${roomId}`, {
            event: 'participantSynced',
            payload
        });
    }
};

async function authenticatePeer(peer: Peer) {
    const { token } = getUrlParams(peer.request.url);

    try {
        if (token) {
            await authenticate(token);
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        peer.send({
            event: 'connectError',
            payload: { message: 'unauthorized' }
        });

        throw error;
    }
}

function parseMessage<E extends ClientToServerEventId>(
    message: Message
): { event: E; payload: ClientToServerEventPayload<E> } {
    return message.json();
}

export function useSocketHandler(app: H3) {
    app.get(
        '/_ws',
        defineWebSocketHandler({
            async open(peer) {
                await authenticatePeer(peer);
            },

            async message(peer, message) {
                switch (message.text()) {
                    case '':
                        peer.send('');
                        break;

                    default:
                        await authenticatePeer(peer);

                        const { event, payload } = parseMessage(message);

                        handlers[event]?.(payload as any, peer);
                        break;
                }
            },

            close(peer) {
                for (const channel of peer.topics) {
                    if (channel.startsWith('room')) {
                        peer.publish(channel, {
                            event: 'participantDisconnected',
                            payload: {
                                participantId: peer.context.participantId
                            }
                        });
                    }

                    peer.unsubscribe(channel);
                }
            },

            error(peer, error) {
                console.log('[ws] error', peer, error);
                console.error(error);
            }
        })
    );
}

export function useSocketPlugin(app: H3) {
    return ws({
        async resolve(req) {
            const { crossws } = await app.fetch(req);

            return crossws;
        }
    });
}
