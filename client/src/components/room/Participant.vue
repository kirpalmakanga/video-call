<script setup lang="ts">
import {
    computed,
    onBeforeUnmount,
    onMounted,
    ref,
    reactive,
    watch
} from 'vue';
import Contain from '../base/Contain.vue';
import Loader from '../base/Loader.vue';
import { useVolumeLevel } from '../../composables/use-volume-level';

const props = withDefaults(
    defineProps<{
        name: string;
        isLocalParticipant?: boolean;
        isActiveParticipant?: boolean;
        stream: MediaStream | null;
        isMuted: boolean;
        useContentRatio?: boolean;
    }>(),
    { stream: null }
);

const emit = defineEmits<{ 'toggle-mute': [e: void] }>();

const state = reactive<{
    isLoading: boolean;
    aspectRatio: number;
}>({
    isLoading: true,
    aspectRatio: 0
});
const video = ref<HTMLVideoElement>();

const volume = useVolumeLevel(computed(() => props.stream));

async function setVideoSource(stream: MediaStream | null) {
    if (video.value) {
        video.value.srcObject = stream;
    }
}

function onVideoLoaded() {
    if (video.value) {
        state.aspectRatio = video.value.videoWidth / video.value.videoHeight;
    }

    state.isLoading = false;
}

watch(
    () => props.stream,
    (stream) => {
        state.isLoading = true;

        setVideoSource(stream);
    }
);

onMounted(() => setVideoSource(props.stream));

onBeforeUnmount(() => setVideoSource(null));
</script>

<template>
    <Contain
        class="grow"
        :aspect-ratio="state.aspectRatio"
        :style="useContentRatio ? { aspectRatio: state.aspectRatio } : null"
    >
        <div class="relative flex w-full h-full rounded overflow-hidden">
            <video
                ref="video"
                class="grow"
                autoplay
                :muted="isLocalParticipant || isActiveParticipant || isMuted"
                @loadeddata="onVideoLoaded"
            />

            <div
                class="absolute inset-0 transition-opacity"
                :class="{ 'ring-4 ring-inset ring-blue-600 ': volume > 20 }"
            ></div>

            <span class="absolute left-2 right-2 bottom-2 flex">
                <span
                    class="bg-gray-800 text-gray-100 text-sm rounded whitespace-nowrap overflow-hidden text-ellipsis px-2 py-1"
                >
                    {{ name }}
                </span>
            </span>

            <button
                class="absolute top-2 right-2 bg-gray-800 text-gray-100 rounded p-1 flex justify-center items-center"
                :class="{
                    'pointer-events-none cursor-default': isLocalParticipant
                }"
                @click.stop="emit('toggle-mute')"
            >
                <UIcon
                    class="w-5 h-5"
                    :name="
                        isMuted ? 'i-mdi-microphone-off' : 'i-mdi-microphone'
                    "
                />
            </button>

            <Transition name="fade">
                <span
                    v-if="state.isLoading"
                    class="absolute inset-0 flex justify-center items-center bg-gray-800 text-gray-100"
                >
                    <Loader class="w-6 h-6" />
                </span>
            </Transition>
        </div>
    </Contain>
</template>
