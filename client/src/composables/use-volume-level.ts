import { onBeforeUnmount, readonly, ref, watch, type Ref } from 'vue';

const audioContext = new AudioContext();

export function useVolumeLevel(stream: Ref<MediaStream | undefined>) {
    const volume = ref<number>(0);

    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;

    function stopRecording() {
        analyser?.disconnect();
        source?.disconnect();

        analyser = null;
        source = null;

        volume.value = 0;
    }

    function startRecording() {
        if (analyser || !stream.value) {
            return;
        }

        source = audioContext.createMediaStreamSource(stream.value);
        analyser = audioContext.createAnalyser();

        source.connect(analyser);

        const pcmData = new Float32Array(analyser.fftSize);

        function onFrame() {
            if (analyser) {
                let sumSquares = 0.0;

                analyser.getFloatTimeDomainData(pcmData);

                for (const amplitude of pcmData) {
                    sumSquares += amplitude * amplitude;
                }

                const v = Math.min(
                    200 * Math.sqrt(sumSquares / pcmData.length),
                    100
                );

                volume.value = v > 100 ? 100 : v;

                requestAnimationFrame(onFrame);
            }
        }

        requestAnimationFrame(onFrame);
    }

    watch(
        stream,
        () => {
            if (analyser) {
                stopRecording();
            }

            if (stream.value) {
                startRecording();
            }
        },
        { immediate: true }
    );

    onBeforeUnmount(stopRecording);

    return readonly(volume);
}
