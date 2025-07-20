<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { useVolumeLevel } from '../../composables/use-volume-level';
import { useUserMedia } from '@vueuse/core';

const props = defineProps<{ deviceId: string | null }>();

const { stream, start, stop } = useUserMedia({
    constraints: computed(() => ({
        audio: { deviceId: props.deviceId || '' }
    }))
});

const volume = useVolumeLevel(stream);

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

onBeforeUnmount(stop);
</script>

<template>
    <UProgress v-model="volume" />
</template>
