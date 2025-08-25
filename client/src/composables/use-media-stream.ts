import { onBeforeUnmount, watch, type Ref } from 'vue';
import { useUserMedia } from '@vueuse/core';

interface MediastreamOptions {
    constraints: Ref<MediaStreamConstraints>;
    isVideoEnabled: Ref<boolean>;
    isAudioEnabled: Ref<boolean>;
    volume: Ref<number>;
}

function getAudioContext() {
    if (
        !window.currentAudioContext ||
        window.currentAudioContext.state === 'closed'
    ) {
        window.currentAudioContext = new AudioContext();
    }

    return window.currentAudioContext;
}

export function useMediaStream({
    constraints,
    isAudioEnabled,
    isVideoEnabled,
    volume
}: MediastreamOptions) {
    const { stream, start, stop } = useUserMedia({
        constraints
    });

    const audioContext = getAudioContext();
    let source: MediaStreamAudioSourceNode | null = null;
    let destination: MediaStreamAudioDestinationNode | null = null;
    let gainFilter: GainNode | null = null;
    let sourceAudioTrack: MediaStreamTrack | null = null;

    function setGain() {
        if (!gainFilter) {
            return;
        }

        if (volume.value >= 0 && volume.value <= 100) {
            gainFilter.gain.value = volume.value / 100;
        } else {
            console.error(
                'useMediaStream error: volume value must be between 0 and 100'
            );
        }
    }

    function createControlledStream(sourceStream: MediaStream) {
        source = audioContext.createMediaStreamSource(sourceStream);

        gainFilter = audioContext.createGain();
        source.connect(gainFilter);

        destination = audioContext.createMediaStreamDestination();
        gainFilter.connect(destination);

        gainFilter.gain.value = 1;

        setGain();

        const [sourceStreamAudioTrack] = sourceStream.getAudioTracks();
        const [controlledAudioTrack] = destination.stream.getAudioTracks();

        if (sourceStreamAudioTrack && controlledAudioTrack) {
            sourceAudioTrack = sourceStreamAudioTrack;

            sourceStream.addTrack(controlledAudioTrack);
            sourceStream.removeTrack(sourceStreamAudioTrack);
        }
    }

    async function removeControlledStream() {
        if (sourceAudioTrack) {
            sourceAudioTrack.stop();
            sourceAudioTrack = null;
        }

        if (gainFilter) {
            gainFilter.disconnect();
            gainFilter = null;
        }

        if (source) {
            source.disconnect();
            source = null;
        }

        if (destination) {
            destination.disconnect();
            destination = null;
        }
    }

    function setVideoStatus() {
        const videoTracks = stream.value?.getVideoTracks();

        if (videoTracks?.length) {
            for (const track of videoTracks) {
                track.enabled = isVideoEnabled.value;
            }
        }
    }

    function setAudioStatus() {
        const audioTracks = stream.value?.getAudioTracks();

        if (audioTracks?.length) {
            for (const track of audioTracks) {
                track.enabled = isAudioEnabled.value;
            }
        }
    }

    function handleSourceStreamChange(sourceStream?: MediaStream) {
        removeControlledStream();

        if (sourceStream) {
            createControlledStream(sourceStream);

            setAudioStatus();
            setVideoStatus();
        }
    }

    watch(stream, handleSourceStreamChange);

    watch(isVideoEnabled, setVideoStatus);
    watch(isAudioEnabled, setAudioStatus);

    watch(volume, setGain);

    onBeforeUnmount(removeControlledStream);

    return {
        stream,
        start,
        stop
    };
}
