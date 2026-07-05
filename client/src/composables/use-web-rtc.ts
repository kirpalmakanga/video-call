import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import { assertIsDefined } from '../../../shared/utils/assert';
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
    onPeerDisconnection: (peerId: string) => void;
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

        assertIsDefined(connection, 'Peer connection does not exist or has already been closed.');

        return connection;
    }

    return {
        createPeer: (
            peerId: string,
            events: {
                onIceStateChange: (state: RTCIceConnectionState) => void;
                onIceCandidate: (candidate: RTCIceCandidate) => void;
                onTrack: (event: RTCTrackEvent) => void;
            }
        ) => {
            const connection = new RTCPeerConnection(connectionConfiguration);

            peerConnections.set(peerId, connection);

            connection.oniceconnectionstatechange = () => {
                events.onIceStateChange(connection.iceConnectionState);
            };
            connection.onicecandidate = ({ candidate }) => {
                if (candidate) {
                    events.onIceCandidate(candidate);
                }
            };
            connection.ontrack = events.onTrack;

            return connection;
        },
        removePeer: (peerId: string) => {
            const connection = getPeer(peerId);

            connection.onicecandidate = null;
            connection.oniceconnectionstatechange = null;
            connection.ontrack = null;

            connection.close();

            peerConnections.delete(peerId);
        },
        getAllPeerIds: () => {
            return [...peerConnections.keys()];
        },
        getPeer,
        hasPeers: () => {
            return peerConnections.size > 0;
        },
        hasPeer,
        hasActivePeer: (peerId: string) => {
            const connection = getPeer(peerId);

            return connection.iceConnectionState === 'connected';
        }
    };
}

export function useWebRTC(
    localStream: Ref<MediaStream | undefined>,
    { onIceCandidate, onPeerDisconnection }: RTCOptions
) {
    const { createPeer, removePeer, getAllPeerIds, getPeer, hasPeer, hasPeers } =
        usePeerConnections();

    const peerStreams = ref<{ [peerId: string]: MediaStream }>({});

    function getPeerStream(peerId: string) {
        return peerStreams.value[peerId] || null;
    }

    function setPeerStream(peerId: string, stream: MediaStream | null) {
        const currentStream = getPeerStream(peerId);

        if (stream && stream.id !== currentStream?.id) {
            peerStreams.value = { ...peerStreams.value, [peerId]: stream };
        }
    }

    function removePeerStream(peerId: string) {
        const stream = getPeerStream(peerId);

        if (stream) {
            closeStream(stream);

            peerStreams.value = omit(peerStreams.value, peerId);
        } else {
            console.warn('Peer stream does not exist or already has been removed.');
        }
    }

    function disconnectFromPeer(peerId: string) {
        unbindLocalStreamFromPeer(peerId);

        removePeerStream(peerId);

        removePeer(peerId);
    }

    async function setPeerConnectionTrack(peerId: string, newTrack: MediaStreamTrack) {
        assertIsDefined(localStream.value, 'Local stream unavailable.');

        const connection = getPeer(peerId);
        const senders = connection.getSenders();
        const sender = senders.find(({ track }) => track?.kind === newTrack.kind);

        if (sender && sender.track?.id !== newTrack.id) {
            await sender.replaceTrack(newTrack);
        } else if (!sender) {
            connection.addTrack(newTrack, localStream.value);
        }
    }

    async function bindLocalStreamToPeer(peerId: string) {
        assertIsDefined(localStream.value, 'Local stream unavailable.');

        const [videoTrack] = localStream.value.getVideoTracks();
        const [audioTrack] = localStream.value.getAudioTracks();

        if (videoTrack) {
            await setPeerConnectionTrack(peerId, videoTrack);
        }

        if (audioTrack) {
            await setPeerConnectionTrack(peerId, audioTrack);
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

    async function syncLocalStreamWithPeers() {
        if (hasPeers()) {
            for (const peerId of getAllPeerIds()) {
                await bindLocalStreamToPeer(peerId);
            }
        }
    }

    function unbindLocalStreamFromAllPeers() {
        if (hasPeers()) {
            for (const peerId of getAllPeerIds()) {
                unbindLocalStreamFromPeer(peerId);
            }
        }
    }

    function disconnectFromAllPeers() {
        if (hasPeers()) {
            for (const peerId of getAllPeerIds()) {
                disconnectFromPeer(peerId);
            }
        }
    }

    watch(localStream, async (stream, previousStream) => {
        if (previousStream) {
            previousStream.onaddtrack = null;
            previousStream.onremovetrack = null;
        }

        if (stream) {
            stream.onaddtrack = syncLocalStreamWithPeers;
            stream.onremovetrack = syncLocalStreamWithPeers;

            await syncLocalStreamWithPeers();
        } else {
            unbindLocalStreamFromAllPeers();
        }
    });

    onBeforeUnmount(disconnectFromAllPeers);

    return {
        peerStreams,
        connectToPeer: async (peerId: string) => {
            if (hasPeer(peerId)) {
                disconnectFromPeer(peerId);
            }

            createPeer(peerId, {
                onIceCandidate: (candidate) => {
                    onIceCandidate(peerId, candidate);
                },
                onTrack: ({ streams: [stream = null] }) => {
                    setPeerStream(peerId, stream);
                },
                onIceStateChange: (state) => {
                    // TODO: handle state === 'failed'

                    if (['closed', 'disconnected'].includes(state)) {
                        disconnectFromPeer(peerId);

                        onPeerDisconnection(peerId);
                    }
                }
            });

            if (localStream.value) {
                await bindLocalStreamToPeer(peerId);
            }
        },
        syncLocalStreamWithPeers,
        createOffer: async (peerId: string) => {
            const connection = getPeer(peerId);

            const offer = await connection.createOffer();

            await connection.setLocalDescription(new RTCSessionDescription(offer));

            return offer;
        },
        createAnswer: async (peerId: string, offer: RTCSessionDescriptionInit) => {
            const connection = getPeer(peerId);

            await connection.setRemoteDescription(new RTCSessionDescription(offer));

            const answer = await connection.createAnswer();

            await connection.setLocalDescription(new RTCSessionDescription(answer));

            return answer;
        },
        processAnswer: async (peerId: string, answer: RTCSessionDescriptionInit) => {
            const connection = getPeer(peerId);

            await connection.setRemoteDescription(new RTCSessionDescription(answer));
        },
        addIceCandidate: async (peerId: string, candidate: RTCIceCandidate) => {
            const connection = getPeer(peerId);

            await connection.addIceCandidate(new RTCIceCandidate(candidate));
        },
        disconnectFromPeer,
        disconnectFromAllPeers
    };
}
