<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue';
import { useVolumeLevel } from '../../composables/use-volume-level';
import { useUserMedia } from '@vueuse/core';

const props = withDefaults(
    defineProps<{ isEnabled?: boolean; deviceId: string | null }>(),
    { isEnabled: true }
);

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

watch(
    () => [stream.value, props.isEnabled] as const,
    ([stream, isEnabled]) => {
        if (stream) {
            for (const track of stream.getAudioTracks()) {
                track.enabled = isEnabled;
            }
        }
    }
);

onBeforeUnmount(stop);
</script>

<template>
    <div class="flex items-center gap-2">
        <UIcon
            class="size-5"
            :name="isEnabled ? 'i-mdi-volume' : 'i-mdi-volume-off'"
        />
        <UProgress v-model="volume" />
    </div>
</template>
