import {
    computed,
    onBeforeUnmount,
    shallowReactive,
    watch,
    type Ref
} from 'vue';
import { assertIsDefined } from '../../../utils/assert';

// const configuration = {
//     iceServers: [
//         { urls: 'stun:stun.stunprotocol.org:3478' },
//         { urls: 'stun:stun.l.google.com:19302' }
//     ]
// };

interface RTCSessionOptions {
    onIceCandidate: (peerId: string, candidate: RTCIceCandidate) => void;
    onDisconnection?: (peerId: string) => void;
}

interface Peer {
    connection: RTCPeerConnection;
    stream: MediaStream | null;
}

function closeStream(stream: MediaStream) {
    for (const track of stream.getTracks()) {
        track.stop();
    }
}

export function useRTCSession(
    localStream: Ref<MediaStream | undefined>,
    { onIceCandidate, onDisconnection }: RTCSessionOptions
) {
    const peers = shallowReactive<{ [peerId: string]: Peer }>({});

    function hasPeer(peerId: string) {
        return !!peers[peerId];
    }

    function hasPeers() {
        return !!Object.values(peers).length;
    }

    function getPeer(peerId: string) {
        const peer = peers[peerId];

        assertIsDefined(
            peer,
            'Peer connection does not exist or has already been closed.'
        );

        return peer;
    }

    function getPeerConnection(peerId: string) {
        return getPeer(peerId).connection;
    }

    function getAllPeerIds() {
        return [...Object.keys(peers)];
    }

    function getAllPeerStreams() {
        return Object.entries(peers).reduce((obj, [peerId, { stream }]) => {
            if (stream) {
                obj[peerId] = stream;
            }

            return obj;
        }, {} as { [peerId: string]: MediaStream });
    }

    function disconnectFromPeer(peerId: string) {
        const { connection, stream } = getPeer(peerId);

        connection.close();

        if (stream) {
            closeStream(stream);
        }

        delete peers[peerId];
    }

    function createPeer(peerId: string) {
        if (hasPeer(peerId)) {
            throw new Error('Peer connection already exists.');
        }

        const entry = { connection: new RTCPeerConnection(), stream: null };

        peers[peerId] = entry;

        return entry;
    }

    function bindLocalStreamToPeer(peerId: string) {
        assertIsDefined(localStream.value, 'Local stream unavailable.');

        const connection = getPeerConnection(peerId);

        for (const track of localStream.value.getTracks()) {
            connection.addTrack(track, localStream.value);
        }
    }

    function unbindLocalStreamFromPeer(peerId: string) {
        const connection = getPeerConnection(peerId);
        const senders = connection.getSenders();

        if (senders.length) {
            for (const sender of senders) {
                connection.removeTrack(sender);
            }
        }
    }

    function setPeerStream(peerId: string, peerStream: MediaStream | null) {
        const { stream, ...peer } = getPeer(peerId);

        if (stream?.id !== peerStream?.id) {
            peers[peerId] = {
                ...peer,
                stream: peerStream
            };
        }
    }

    function bindLocalStreamToAllPeers() {
        assertIsDefined(localStream.value);

        for (const peerId of getAllPeerIds()) {
            bindLocalStreamToPeer(peerId);
        }
    }

    function unbindLocalStreamFromAllPeers() {
        for (const peerId of getAllPeerIds()) {
            unbindLocalStreamFromPeer(peerId);
        }
    }

    function disconnectFromAllPeers() {
        if (hasPeers()) {
            for (const peerId of getAllPeerIds()) {
                disconnectFromPeer(peerId);
            }
        }
    }

    watch(localStream, () => {
        if (hasPeers()) {
            unbindLocalStreamFromAllPeers();

            bindLocalStreamToAllPeers();
        }
    });

    onBeforeUnmount(disconnectFromAllPeers);

    return {
        peerStreams: computed(getAllPeerStreams),
        hasPeer,
        disconnectFromPeer,
        disconnectFromAllPeers,
        async createOffer(peerId: string) {
            const connection = getPeerConnection(peerId);

            const offer = await connection.createOffer();

            await connection.setLocalDescription(
                new RTCSessionDescription(offer)
            );

            return offer;
        },
        async createAnswer(peerId: string, offer: RTCSessionDescriptionInit) {
            const connection = getPeerConnection(peerId);

            await connection.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            const answer = await connection.createAnswer();

            await connection.setLocalDescription(
                new RTCSessionDescription(answer)
            );

            return answer;
        },
        async processAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
            const connection = getPeerConnection(peerId);

            await connection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        },
        async addIceCandidate(
            peerId: string,
            sdpMLineIndex: number | null | undefined,
            candidate: string | undefined
        ) {
            const connection = getPeerConnection(peerId);

            await connection.addIceCandidate(
                new RTCIceCandidate({
                    sdpMLineIndex,
                    candidate
                })
            );
        },
        connectToPeer(peerId: string) {
            const { connection } = createPeer(peerId);

            connection.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    onIceCandidate(peerId, candidate);
                }
            };

            if (onDisconnection) {
                connection.oniceconnectionstatechange = () => {
                    const { iceConnectionState } = connection;

                    if (
                        iceConnectionState === 'failed' ||
                        iceConnectionState === 'closed' ||
                        iceConnectionState === 'disconnected'
                    ) {
                        onDisconnection(peerId);
                    }
                };
            }

            connection.ontrack = ({ streams: [stream = null] }) => {
                setPeerStream(peerId, stream);
            };

            bindLocalStreamToPeer(peerId);
        }
    };
}
