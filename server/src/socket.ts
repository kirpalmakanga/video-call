import { defineWebSocketHandler, type H3 } from 'h3';
import { plugin as ws } from 'crossws/server';
import type { Peer } from 'crossws';

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
    requestConnection({ roomId }, peer) {
        peer.subscribe(`room:${roomId}`);
        peer.subscribe(`participant:${peer.id}:room:${roomId}`);

        peer.send({
            event: 'connectionConfirmed',
            payload: { participantId: peer.id }
        });
    },
    connectParticipant({ roomId }, peer) {
        peer.publish(`room:${roomId}`, {
            event: 'participantConnected',
            payload: { participantId: peer.id }
        });
    },
    disconnectParticipant({ roomId }, peer) {
        peer.publish(`room:${roomId}`, {
            event: 'participantDisconnected',
            payload: { participantId: peer.id }
        });

        peer.unsubscribe(`room:${roomId}`);
        peer.unsubscribe(`participant:${peer.id}:room:${roomId}`);
    },
    offer({ roomId, targetParticipantId, ...payload }, peer) {
        peer.publish(`participant:${targetParticipantId}:room:${roomId}`, {
            event: 'incomingOffer',
            payload: {
                senderParticipantId: peer.id,
                ...payload
            }
        });
    },
    answer({ roomId, targetParticipantId, ...payload }, peer) {
        peer.publish(`participant:${targetParticipantId}:room:${roomId}`, {
            event: 'incomingAnswer',
            payload: {
                senderParticipantId: peer.id,
                ...payload
            }
        });
    },
    iceCandidate({ roomId, targetParticipantId, ...payload }, peer) {
        peer.publish(`participant:${targetParticipantId}:room:${roomId}`, {
            event: 'incomingIceCandidate',
            payload: {
                senderParticipantId: peer.id,
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

export function useSocketHandler(app: H3) {
    app.get(
        '/_ws',
        defineWebSocketHandler({
            open(peer) {
                console.log('[ws] open', peer);
                // peer.send({ user: 'server', message: `Welcome ${peer}!` });
            },

            message(peer, message) {
                if (message.text() === 'ping') {
                    peer.send('pong');

                    return;
                }

                const { event, payload } = message.json() as Event;

                const handler = handlers[event];

                handler(payload, peer);
            },

            close(peer) {
                for (const channel of peer.topics) {
                    if (channel.startsWith('room')) {
                        peer.publish(channel, {
                            event: 'participantDisconnected',
                            payload: { participantId: peer.id }
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
