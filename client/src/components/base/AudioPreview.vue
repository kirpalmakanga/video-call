<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import { useVolumeLevel } from '../../composables/use-volume-level';
import { useMediaStream } from '../../composables/use-media-stream';

const props = defineProps<{ deviceId: string | null }>();

const { stream, enableStream, disableStream } = useMediaStream();

const volume = useVolumeLevel(stream);

watch(
    () => props.deviceId,
    async (deviceId) => {
        if (deviceId) {
            enableStream({ audio: { deviceId } });
        } else {
            disableStream();
        }
    },
    { immediate: true }
);

onBeforeUnmount(disableStream);
</script>

<template>
    <UProgress v-model="volume" />
</template>
