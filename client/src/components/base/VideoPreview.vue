<script setup lang="ts">
import { computed, onBeforeUnmount, useTemplateRef, watch } from 'vue';
import Loader from './Loader.vue';
import { useUserMedia } from '@vueuse/core';

const props = defineProps<{ deviceId: string | null }>();

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

watch(stream, (stream) => {
    if (video.value) {
        video.value.srcObject = stream || null;
    }
});

onBeforeUnmount(stop);
</script>

<template>
    <div class="relative w-full bg-gray-800">
        <video ref="video" class="w-full aspect-video" muted autoplay />
    </div>
</template>
