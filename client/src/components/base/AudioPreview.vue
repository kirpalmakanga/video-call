<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useVolumeLevel } from '../../composables/use-volume-level';
import { getStream, closeStream } from '../../utils/media';

const props = defineProps<{ deviceId: string | null }>();

const stream = ref<MediaStream | null>(null);

const volume = useVolumeLevel(stream);

function clearStream() {
    if (stream.value) {
        closeStream(stream.value);
    }
}

watch(
    () => props.deviceId,
    async (deviceId) => {
        clearStream();

        if (deviceId) {
            stream.value = await getStream({ audio: { deviceId } });
        } else {
            stream.value = null;
        }
    },
    { immediate: true }
);

onBeforeUnmount(clearStream);
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
