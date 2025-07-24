<script setup lang="ts">
import { computed, onBeforeUnmount, useTemplateRef, watch } from 'vue';
import Loader from './Loader.vue';
import { useUserMedia } from '@vueuse/core';

const props = withDefaults(
    defineProps<{ isEnabled: boolean; deviceId: string | null }>(),
    { isEnabled: true }
);

const video = useTemplateRef<HTMLVideoElement>('video');

const { stream, start, stop } = useUserMedia({
    constraints: computed(() => ({
        video: { deviceId: props.deviceId || '' }
    }))
});

watch(
    () => props.deviceId,
    async (deviceId) => {
        if (deviceId) {
            start();
        } else {
            stop();
        }
    },
    { immediate: true }
);

watch(
    () => [stream.value, props.isEnabled] as const,
    ([stream, isEnabled]) => {
        if (stream) {
            for (const track of stream.getVideoTracks()) {
                track.enabled = isEnabled;
            }
        }

        if (video.value) {
            video.value.srcObject = stream || null;
        }
    }
);

onBeforeUnmount(stop);
</script>

<template>
    <div class="relative w-full bg-gray-800">
        <video ref="video" class="w-full aspect-video" muted autoplay />

        <div
            v-if="!isEnabled"
            class="absolute inset-0 flex items-center justify-center bg-gray-800"
        >
            <UIcon class="size-6" name="i-mdi-video-off" />
        </div>
    </div>
</template>
