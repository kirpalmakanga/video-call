<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import LoadingIcon from './LoadingIcon.vue';
import { closeStream, getStream } from '../../utils/media';

const video = ref<HTMLVideoElement>();
const isLoading = ref<boolean>(true);

const props = defineProps<{ deviceId: string | null }>();

async function setupStream() {
    const { deviceId } = props;

    isLoading.value = true;

    if (deviceId && video.value) {
        try {
            video.value.srcObject = await getStream({ video: { deviceId } });
        } catch (error) {
            console.error(error);
        }
    }

    isLoading.value = false;
}

function clearStream() {
    if (video.value) {
        closeStream(video.value.srcObject as MediaStream);

        video.value.srcObject = null;
    }
}

watch(
    () => props.deviceId,
    async (deviceId) => {
        if (deviceId) {
            setupStream();
        } else {
            clearStream();
        }
    }
);

onMounted(setupStream);

onBeforeUnmount(clearStream);
</script>

<template>
    <div class="relative w-full bg-black">
        <video ref="video" class="w-full aspect-video" muted autoplay></video>

        <Transition name="fade">
            <div
                v-if="isLoading"
                class="absolute inset-0 bg-gray-800 flex items-center justify-center"
            >
                <LoadingIcon class="w-6 h-6" />
            </div>
        </Transition>
    </div>
</template>
