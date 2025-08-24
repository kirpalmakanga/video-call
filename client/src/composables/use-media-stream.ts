import { onBeforeUnmount, watch, type Ref } from 'vue';
import { useUserMedia } from '@vueuse/core';

interface MediastreamOptions {
    constraints: Ref<MediaStreamConstraints>;
    isVideoEnabled: Ref<boolean>;
    isAudioEnabled: Ref<boolean>;
    volume: Ref<number>;
}

function getAudioContext() {
    if (!window.currentAudioContext) {
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

    async function createControlledStream(sourceStream: MediaStream) {
        await audioContext.resume();

        source = audioContext.createMediaStreamSource(sourceStream);

        gainFilter = audioContext.createGain();
        source.connect(gainFilter);

        destination = audioContext.createMediaStreamDestination();
        gainFilter.connect(destination);

        gainFilter.gain.value = 1;

        setGain();

        const [controlledAudioTrack] = destination.stream.getAudioTracks();
        const [sourceAudioTrack] = sourceStream.getAudioTracks();

        if (controlledAudioTrack && sourceAudioTrack) {
            sourceStream.addTrack(controlledAudioTrack);
            sourceStream.removeTrack(sourceAudioTrack);
        }
    }

    function removeControlledStream() {
        if (gainFilter) {
            gainFilter.disconnect();
            gainFilter = null;
        }

        if (destination) {
            for (const track of destination.stream.getTracks()) {
                track.stop();
            }

            destination.disconnect();
            destination = null;
        }

        if (source) {
            source.disconnect();
            source = null;
        }

        audioContext.close();
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
        console.log(sourceStream);
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
