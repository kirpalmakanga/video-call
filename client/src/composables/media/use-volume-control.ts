import { onBeforeUnmount, watch, type Ref } from 'vue';

interface UseGainControlOptions {
    stream: Ref<MediaStream | undefined>;
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

export function useVolumeControl({ stream, volume }: UseGainControlOptions) {
    const audioContext = getAudioContext();
    let source: MediaStreamAudioSourceNode | null = null;
    let destination: MediaStreamAudioDestinationNode | null = null;
    let gainFilter: GainNode | null = null;
    let sourceAudioTrack: MediaStreamTrack | null = null;
    let controlledAudioTrack: MediaStreamTrack | null = null;

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

    function createControlledStream(stream: MediaStream) {
        source = audioContext.createMediaStreamSource(stream);

        gainFilter = audioContext.createGain();
        source.connect(gainFilter);

        destination = audioContext.createMediaStreamDestination();
        gainFilter.connect(destination);

        gainFilter.gain.value = 1;

        setGain();

        sourceAudioTrack = stream.getAudioTracks().at(0) || null;
        controlledAudioTrack =
            destination.stream.getAudioTracks().at(0) || null;

        if (sourceAudioTrack && controlledAudioTrack) {
            stream.removeTrack(sourceAudioTrack);
            stream.addTrack(controlledAudioTrack);
        }
    }

    async function removeControlledStream() {
        if (sourceAudioTrack) {
            sourceAudioTrack.stop();
            sourceAudioTrack = null;
        }

        if (controlledAudioTrack) {
            controlledAudioTrack.stop();
            controlledAudioTrack = null;
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

    function handleSourceStreamChange(stream?: MediaStream) {
        removeControlledStream();

        if (stream) {
            createControlledStream(stream);
        }
    }

    watch(stream, handleSourceStreamChange, { immediate: true });
    watch(volume, setGain);

    onBeforeUnmount(removeControlledStream);
}
