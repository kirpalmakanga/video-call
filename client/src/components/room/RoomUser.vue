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
import Icon from '../base/Icon.vue';
import LoadingIcon from '../base/LoadingIcon.vue';
import { useVolumeLevel } from '../../composables/use-volume-level';

const props = withDefaults(
    defineProps<{
        name: string;
        isLocalUser?: boolean;
        isActiveUser?: boolean;
        stream: MediaStream | null;
        isMuted: boolean;
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
    <div
        class="relative flex flex-grow overflow-hidden"
        :style="!isActiveUser ? { aspectRatio: state.aspectRatio } : null"
    >
        <Contain class="flex-grow" :aspect-ratio="state.aspectRatio">
            <div class="relative flex w-full h-full rounded overflow-hidden">
                <video
                    ref="video"
                    class="flex-grow"
                    :muted="isLocalUser || isMuted"
                    autoplay
                    @loadeddata="onVideoLoaded"
                />

                <div
                    class="absolute inset-0 transition-opacity"
                    :class="{ 'ring-4 ring-inset ring-blue-600 ': volume > 20 }"
                ></div>

                <span class="absolute left-2 right-2 bottom-2 flex">
                    <span
                        class="bg-gray-800 text-gray-100 rounded whitespace-nowrap overflow-hidden text-ellipsis px-2 py-1"
                    >
                        {{ name }}
                    </span>
                </span>

                <button
                    class="absolute top-2 right-2 bg-gray-800 text-gray-100 rounded p-1 flex justify-center items-center"
                    :class="{
                        'pointer-events-none cursor-default': isLocalUser
                    }"
                    @click.stop="emit('toggle-mute')"
                >
                    <Icon
                        class="w-5 h-5"
                        :name="isMuted ? 'microphone-off' : 'microphone'"
                    />
                </button>
            </div>
        </Contain>

        <Transition name="fade">
            <span
                v-if="state.isLoading"
                class="absolute inset-0 flex justify-center items-center bg-gray-800 text-gray-100"
            >
                <LoadingIcon class="w-6 h-6" />
            </span>
        </Transition>
    </div>
</template>
