import type { Hooks, Peer } from 'crossws';
import { authenticatePeer, parseMessage } from '../services/socket.service';

type EventHandlers = {
    [K in keyof ClientToServerEvents]: (payload: ClientToServerEventPayload<K>, peer: Peer) => void;
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
    iceCandidate({ roomId, participantId, targetParticipantId, ...payload }, peer) {
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

export const hooks: Partial<Hooks> = {
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
                const { [event]: handler } = handlers;

                if (handler) {
                    handler(payload as any, peer);
                } else {
                    peer.send({
                        event: 'error',
                        payload: { message: `Unsupported event: ${event}` }
                    });
                }

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
};
