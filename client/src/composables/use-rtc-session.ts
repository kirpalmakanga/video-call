import { computed, ref, watch } from 'vue';
import { closeStream } from '../utils/media';

// const configuration = {
//     iceServers: [
//         {
//             urls: 'stun:stun.1.google.com:19302'
//         }
//     ]
// };

interface RTCSessionOptions {
    onIceCandidate: (peerId: string, candidate: RTCIceCandidate) => void;
    onDisconnection: (peerId: string) => void;
}

export function useRTCSession({
    onIceCandidate,
    onDisconnection
}: RTCSessionOptions) {
    const peers = ref<
        Map<
            string,
            { connection: RTCPeerConnection; stream: MediaStream | null }
        >
    >(new Map());

    function hasPeers() {
        return !!peers.value.size;
    }

    function getAllPeerIds() {
        return peers.value.keys();
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
        let connection = peers.value.get(peerId);

        if (!connection) {
            connection = createPeer(peerId);
        }

        return connection;
    }

    function bindStreamToConnection(peerId: string, stream: MediaStream) {
        const { connection } = getPeer(peerId);

        for (const track of stream.getTracks()) {
            connection.addTrack(track, stream);
        }
    }

    function removeStreamFromConnection(peerId: string) {
        const { connection } = getPeer(peerId);
        const senders = connection.getSenders();

        if (senders.length) {
            for (const sender of senders) {
                connection.removeTrack(sender);
            }
        }
    }

    function setPeerStream(peerId: string, stream: MediaStream | null) {
        const entry = peers.value.get(peerId);

        if (entry) {
            peers.value.set(peerId, {
                ...entry,
                stream
            });
        }
    }

    watch(peers, () => console.log('peers:update', [...peers.value.values()]), {
        deep: true
    });

    return {
        disconnectFromAllPeers() {
            for (const { connection, stream } of peers.value.values()) {
                if (stream) closeStream(stream);

                connection.close();
            }

            peers.value.clear();
        },
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
            await getPeer(peerId).connection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        },
        bindLocalStream(stream: MediaStream) {
            if (hasPeers()) {
                for (const peerId of getAllPeerIds()) {
                    bindStreamToConnection(peerId, stream);
                }
            }
        },
        unbindLocalStream() {
            if (hasPeers()) {
                for (const peerId of getAllPeerIds()) {
                    removeStreamFromConnection(peerId);
                }
            }
        },
        async addIceCandidate(
            peerId: string,
            sdpMLineIndex: number,
            candidate: string
        ) {
            await getPeer(peerId).connection.addIceCandidate(
                new RTCIceCandidate({
                    sdpMLineIndex,
                    candidate
                })
            );
        },
        connectToPeer(peerId: string, stream: MediaStream) {
            const { connection } = createPeer(peerId);

            connection.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    onIceCandidate(peerId, candidate);
                }
            };

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

            connection.ontrack = ({ streams: [stream = null] }) => {
                console.log(`peerStream:${peerId}:stream`);
                setPeerStream(peerId, stream);
            };

            bindStreamToConnection(peerId, stream);
        },
        disconnectFromPeer,
        getPeerStream(peerId: string) {
            return getPeer(peerId).stream;
        }
    };
}
