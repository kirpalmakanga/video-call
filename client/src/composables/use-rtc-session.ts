import { ref, watch, type Ref } from 'vue';
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

        if (!entry) return;

        entry.connection.close();

        if (entry.stream) closeStream(entry.stream);

        peers.value.delete(peerId);
    }

    function createPeer(peerId: string) {
        disconnectFromPeer(peerId);

        const entry = { connection: new RTCPeerConnection(), stream: null };

        peers.value.set(peerId, entry);

        return entry;
    }

    function getPeer(peerId: string) {
        return peers.value.get(peerId);
    }

    function bindLocalStreamToPeer(peerId: string) {
        assertIsDefined(localStream.value);

        const peer = getPeer(peerId);

        assertIsDefined(peer);

        for (const track of localStream.value.getTracks()) {
            peer.connection.addTrack(track, localStream.value);
        }
    }

    function unbindLocalStreamFromPeer(peerId: string) {
        const peer = getPeer(peerId);

        assertIsDefined(peer);

        const senders = peer.connection.getSenders();

        if (senders.length) {
            for (const sender of senders) {
                peer.connection.removeTrack(sender);
            }
        }
    }

    function setPeerStream(peerId: string, stream: MediaStream | null) {
        const peer = getPeer(peerId);

        assertIsDefined(peer);

        if (peer.stream?.id !== stream?.id) {
            peers.value.set(peerId, {
                ...peer,
                stream
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

    watch(localStream, () => {
        if (hasPeers()) {
            unbindLocalStreamFromAllPeers();

            bindLocalStreamToAllPeers();
        }
    });

    return {
        hasPeer,
        hasPeers,
        disconnectFromAllPeers() {
            for (const { connection, stream } of peers.value.values()) {
                if (stream) closeStream(stream);

                connection.close();
            }

            peers.value.clear();
        },
        async createOffer(peerId: string) {
            const peer = getPeer(peerId);

            assertIsDefined(peer);

            const offer = await peer.connection.createOffer();

            await peer.connection.setLocalDescription(
                new RTCSessionDescription(offer)
            );

            return offer;
        },
        async createAnswer(peerId: string, offer: RTCSessionDescriptionInit) {
            const peer = getPeer(peerId);

            assertIsDefined(peer);

            await peer.connection.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            const answer = await peer.connection.createAnswer();

            await peer.connection.setLocalDescription(
                new RTCSessionDescription(answer)
            );

            return answer;
        },
        async processAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
            const peer = getPeer(peerId);

            assertIsDefined(peer);

            await peer.connection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        },
        async addIceCandidate(
            peerId: string,
            sdpMLineIndex: number,
            candidate: string
        ) {
            const peer = getPeer(peerId);

            assertIsDefined(peer);

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
            return getPeer(peerId)?.stream || null;
        }
    };
}
