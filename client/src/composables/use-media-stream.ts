import { useUserMedia } from '@vueuse/core';
import { watch, type Ref } from 'vue';

interface MediastreamOptions {
    constraints: Ref<MediaStreamConstraints>;
    isVideoEnabled: Ref<boolean>;
    isAudioEnabled: Ref<boolean>;
    volume: Ref<number>;
}

let audioContext: AudioContext | null = null;

function getAudioContext() {
    if (!audioContext) {
        audioContext = new AudioContext();
    }

    return audioContext;
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
    let controlledStream: MediaStream | null = null;

    function setGain() {
        if (gainFilter) {
            gainFilter.gain.value = volume.value / 100;
        }
    }

    function createControlledStream(sourceStream: MediaStream) {
        source = audioContext.createMediaStreamSource(sourceStream);

        gainFilter = audioContext.createGain();
        source.connect(gainFilter);

        destination = audioContext.createMediaStreamDestination();
        gainFilter.connect(destination);

        controlledStream = destination.stream;

        setGain();

        const [controlledAudioTrack] = controlledStream.getAudioTracks();
        const [sourceAudioTrack] = sourceStream.getAudioTracks();

        if (controlledAudioTrack && sourceAudioTrack) {
            sourceStream.addTrack(controlledAudioTrack);
            sourceStream.removeTrack(sourceAudioTrack);
        }
    }

    function removeControlledStream() {
        if (controlledStream) {
            for (const track of controlledStream.getTracks()) {
                track.stop();
            }

            controlledStream = null;
        }

        if (gainFilter) {
            gainFilter.disconnect();
            gainFilter = null;
        }

        if (destination) {
            destination.disconnect();
            destination = null;
        }

        if (source) {
            source.disconnect();
            source = null;
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

    return {
        stream,
        start,
        stop
    };
}
