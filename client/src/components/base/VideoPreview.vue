<script setup lang="ts">
import { onBeforeUnmount, useTemplateRef, watch } from 'vue';
import LoadingIcon from './LoadingIcon.vue';
import { useMediaStream } from '../../composables/use-media-stream';

const video = useTemplateRef<HTMLVideoElement>('video');

const props = defineProps<{ deviceId: string | null }>();

const { stream, isLoadingStream, enableStream, disableStream } =
    useMediaStream();

watch(
    () => props.deviceId,
    async (deviceId) => {
        if (deviceId) {
            enableStream({ video: { deviceId } });
        } else {
            disableStream();
        }
    },
    { immediate: true }
);

watch(stream, (stream: MediaStream | null) => {
    if (video.value) {
        video.value.srcObject = stream;
    }
});

onBeforeUnmount(disableStream);
</script>

<template>
    <div class="relative w-full bg-black">
        <video ref="video" class="w-full aspect-video" muted autoplay></video>

        <Transition name="fade">
            <div
                v-if="isLoadingStream"
                class="absolute inset-0 bg-gray-800 flex items-center justify-center"
            >
                <LoadingIcon class="w-6 h-6" />
            </div>
        </Transition>
    </div>
</template>
