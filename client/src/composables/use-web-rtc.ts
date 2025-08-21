import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { assertIsDefined } from '../../../utils/assert';
import { omit } from '../utils/helpers';

const { VITE_STUN_SERVERS } = import.meta.env;

const connectionConfiguration: RTCConfiguration = VITE_STUN_SERVERS
    ? {
          iceServers: [
              {
                  urls: VITE_STUN_SERVERS.split(',')
              }
          ]
      }
    : {};

interface RTCOptions {
    onIceCandidate: (peerId: string, candidate: RTCIceCandidate) => void;
    onDisconnection?: (peerId: string) => void;
}

function closeStream(stream: MediaStream) {
    for (const track of stream.getTracks()) {
        track.stop();
    }
}

function usePeerConnections() {
    const peerConnections: Map<string, RTCPeerConnection> = new Map();

    function hasPeer(peerId: string) {
        return peerConnections.has(peerId);
    }

    function getPeer(peerId: string) {
        const connection = peerConnections.get(peerId);

        assertIsDefined(
            connection,
            'Peer connection does not exist or has already been closed.'
        );

        return connection;
    }

    return {
        createPeer(peerId: string) {
            const connection = new RTCPeerConnection(connectionConfiguration);

            peerConnections.set(peerId, connection);

            return connection;
        },
        removePeer(peerId: string) {
            const connection = getPeer(peerId);

            connection.close();

            peerConnections.delete(peerId);
        },
        getAllPeerIds() {
            return [...peerConnections.keys()];
        },
        getPeer,
        hasPeers() {
            return peerConnections.size > 0;
        },
        hasPeer
    };
}

export function useWebRTC(
    localStream: Ref<MediaStream | undefined>,
    { onIceCandidate, onDisconnection }: RTCOptions
) {
    const {
        createPeer,
        removePeer,
        getAllPeerIds,
        getPeer,
        hasPeer,
        hasPeers
    } = usePeerConnections();

    const peerStreams = ref<{ [peerId: string]: MediaStream }>({});

    function getPeerStream(peerId: string) {
        return peerStreams.value[peerId] || null;
    }

    function setPeerStream(peerId: string, peerStream: MediaStream | null) {
        const currentStream = getPeerStream(peerId);

        if (peerStream && peerStream.id !== currentStream?.id) {
            peerStreams.value = { ...peerStreams.value, [peerId]: peerStream };
        }
    }

    function removePeerStream(peerId: string) {
        const stream = getPeerStream(peerId);

        assertIsDefined(
            stream,
            'Peer stream does not exist or already has been removed.'
        );

        closeStream(stream);

        peerStreams.value = omit(peerStreams.value, peerId);
    }

    function disconnectFromPeer(peerId: string) {
        removePeer(peerId);

        removePeerStream(peerId);
    }

    function bindLocalStreamToPeer(peerId: string) {
        assertIsDefined(localStream.value, 'Local stream unavailable.');

        const connection = getPeer(peerId);

        for (const track of localStream.value.getTracks()) {
            connection.addTrack(track, localStream.value);
        }
    }

    function unbindLocalStreamFromPeer(peerId: string) {
        const connection = getPeer(peerId);
        const senders = connection.getSenders();

        if (senders.length) {
            for (const sender of senders) {
                connection.removeTrack(sender);
            }
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
        peerStreams,
        connectToPeer(peerId: string) {
            if (hasPeer(peerId)) {
                disconnectFromPeer(peerId);
            }

            const connection = createPeer(peerId);

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
        async createOffer(peerId: string) {
            const connection = getPeer(peerId);

            const offer = await connection.createOffer();

            await connection.setLocalDescription(
                new RTCSessionDescription(offer)
            );

            return offer;
        },
        async createAnswer(peerId: string, offer: RTCSessionDescriptionInit) {
            const connection = getPeer(peerId);

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
            const connection = getPeer(peerId);

            await connection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        },
        async addIceCandidate(peerId: string, candidate: RTCIceCandidate) {
            const connection = getPeer(peerId);

            await connection.addIceCandidate(new RTCIceCandidate(candidate));
        },
        disconnectFromPeer,
        disconnectFromAllPeers
    };
}
