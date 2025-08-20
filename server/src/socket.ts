import { defineWebSocketHandler, type H3 } from 'h3';
import { plugin as ws } from 'crossws/server';
import type { Peer } from 'crossws';
import { getUrlParams } from './utils/helpers.utils';
import { authenticate } from './utils/jwt.utils';

interface Event {
    event: ClientToServerEventId;
    payload: ClientToServerEventPayload<ClientToServerEventId>;
}

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

    if (token) {
        await authenticate(token);
    } else {
        throw new Error('Invalid token');
    }
}

export function useSocketHandler(app: H3) {
    app.get(
        '/_ws',
        defineWebSocketHandler({
            async open(peer) {
                console.log('[ws] open', peer);

                try {
                    await authenticatePeer(peer);
                } catch (error) {
                    peer.send({
                        event: 'error',
                        payload: { message: 'unauthorized' }
                    });
                }
            },

            async message(peer, message) {
                if (message.text() === '') {
                    peer.send('');

                    return;
                }

                try {
                    await authenticatePeer(peer);
                } catch (error) {
                    peer.send({
                        event: 'error',
                        payload: { message: 'unauthorized' }
                    });

                    return;
                }

                const { event, payload } = message.json() as Event;

                const handler = handlers[event];

                if (handler) {
                    handler(payload, peer);
                } else {
                    peer;
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
