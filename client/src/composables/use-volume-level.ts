import { onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue';

const audioContext = new AudioContext();

export function useVolumeLevel(stream: Ref<MediaStream | null>) {
    interface State {
        source: MediaStreamAudioSourceNode | null;
        analyser: AnalyserNode | null;
    }

    const state = reactive<State>({
        source: null,
        analyser: null
    });
    const volume = ref<number>(0);

    function stopRecording() {
        state.analyser?.disconnect();

        state.source?.disconnect();

        state.analyser = null;
        state.source = null;
    }

    function startRecording() {
        if (state.analyser || !stream.value) {
            return;
        }

        state.source = audioContext.createMediaStreamSource(stream.value);
        state.analyser = audioContext.createAnalyser();

        state.source.connect(state.analyser);

        const pcmData = new Float32Array(state.analyser.fftSize);

        function onFrame() {
            if (state.analyser) {
                let sumSquares = 0.0;

                state.analyser.getFloatTimeDomainData(pcmData);

                for (const amplitude of pcmData) {
                    sumSquares += amplitude * amplitude;
                }

                const v = Math.min(
                    200 * Math.sqrt(sumSquares / pcmData.length),
                    100
                );

                volume.value = v > 100 ? 100 : v;

                window.requestAnimationFrame(onFrame);
            }
        }

        window.requestAnimationFrame(onFrame);
    }

    watch(
        stream,
        () => {
            if (state.analyser) {
                stopRecording();
            }

            if (stream.value) {
                startRecording();
            }
        },
        { immediate: true }
    );

    onBeforeUnmount(stopRecording);

    return volume;
}
