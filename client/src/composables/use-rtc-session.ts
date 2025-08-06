import { onBeforeMount, onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { assertIsDefined } from '../utils/assert';

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
    const peers = ref<Map<string, Peer>>(new Map());

    function hasPeer(peerId: string) {
        return peers.value.has(peerId);
    }

    function hasPeers() {
        return !!peers.value.size;
    }

    function getAllPeerIds() {
        return [...peers.value.keys()];
    }

    function disconnectFromPeer(peerId: string) {
        const entry = peers.value.get(peerId);

        if (!entry) {
            throw new Error(
                'Peer connection does not exist or has already been closed.'
            );
        }

        entry.connection.close();

        if (entry.stream) closeStream(entry.stream);

        peers.value.delete(peerId);
    }

    function createPeer(peerId: string) {
        if (hasPeer(peerId)) {
            throw new Error('Peer connection already exists.');
        }

        const entry = { connection: new RTCPeerConnection(), stream: null };

        peers.value.set(peerId, entry);

        return entry;
    }

    function getPeer(peerId: string) {
        const peer = peers.value.get(peerId);

        assertIsDefined(peer);

        return peer;
    }

    function bindLocalStreamToPeer(peerId: string) {
        assertIsDefined(localStream.value);

        const { connection } = getPeer(peerId);

        for (const track of localStream.value.getTracks()) {
            connection.addTrack(track, localStream.value);
        }
    }

    function unbindLocalStreamFromPeer(peerId: string) {
        const { connection } = getPeer(peerId);

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
            peers.value.set(peerId, {
                ...peer,
                stream: peerStream
            });
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
        if (peers.value.size) {
            for (const { connection, stream } of peers.value.values()) {
                if (stream) closeStream(stream);

                connection.close();
            }

            peers.value.clear();
        } else {
            throw new Error('No peer connections to close.');
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
        hasPeer,
        hasPeers,
        disconnectFromAllPeers,
        async createOffer(peerId: string) {
            const { connection } = getPeer(peerId);

            const offer = await connection.createOffer();

            await connection.setLocalDescription(
                new RTCSessionDescription(offer)
            );

            return offer;
        },
        async createAnswer(peerId: string, offer: RTCSessionDescriptionInit) {
            const { connection } = getPeer(peerId);

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
            const { connection } = getPeer(peerId);

            await connection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        },
        async addIceCandidate(
            peerId: string,
            sdpMLineIndex: number,
            candidate: string
        ) {
            const peer = getPeer(peerId);

            await peer.connection.addIceCandidate(
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
        },
        disconnectFromPeer,
        getPeerStream(peerId: string) {
            return hasPeer(peerId) ? getPeer(peerId).stream : null;
        }
    };
}
