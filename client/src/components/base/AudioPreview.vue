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
        disableStream();

        if (deviceId) {
            enableStream({ audio: { deviceId } });
        }
    },
    { immediate: true }
);

onBeforeUnmount(disableStream);
</script>

<template>
    <div class="flex items-center gap-4">
        <div class="flex flex-grow h-2 overflow-hidden bg-gray-100">
            <div
                class="h-full w-full bg-green-700"
                :style="{ transform: `translateX(${volume - 100}%)` }"
            ></div>
        </div>
    </div>
</template>
