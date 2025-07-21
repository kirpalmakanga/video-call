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

const props = defineProps<{
    name: string;
    isLocalParticipant?: boolean;
    isActiveParticipant?: boolean;
    stream?: MediaStream;
    isMuted: boolean;
    isLocallyMuted?: boolean;
    useContentRatio?: boolean;
}>();

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

async function setVideoSource(stream?: MediaStream | null) {
    if (video.value) {
        video.value.srcObject = stream || null;
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
        <div
            class="relative flex w-full h-full rounded overflow-hidden bg-gray-700 group"
        >
            <video
                ref="video"
                class="grow"
                autoplay
                :muted="
                    isLocalParticipant ||
                    isActiveParticipant ||
                    isMuted ||
                    isLocallyMuted
                "
                @loadeddata="onVideoLoaded"
            />

            <div
                class="absolute inset-0 transition-opacity"
                :class="{ 'ring-4 ring-inset ring-blue-600 ': volume > 20 }"
            ></div>

            <span class="absolute right-2 top-2 flex gap-2">
                <span v-if="isMuted" class="p-1 bg-warning-800/60 rounded">
                    <UIcon class="size-5" name="i-mdi-microphone-off" />
                </span>
            </span>

            <span class="absolute left-2 right-2 bottom-2 flex gap-2">
                <div class="grow overflow-ellipsis overflow-hidden rounded">
                    <span
                        class="text-gray-100 text-sm px-2 py-1 whitespace-nowrap bg-gray-800/60 rounded"
                    >
                        {{ name }} ioj azaeofj zo azoefjio zaeoif
                        oioaipergpoergopaergoi
                    </span>
                </div>

                <UTooltip
                    v-if="!isLocalParticipant"
                    :text="isLocallyMuted ? `Unmute ${name}` : `Mute ${name}`"
                >
                    <UButton
                        class="opacity-0 group-hover:opacity-100 transition"
                        size="xs"
                        @click.stop="emit('toggle-mute')"
                    >
                        <UIcon
                            class="size-5"
                            :name="
                                isLocallyMuted
                                    ? 'i-mdi-volume-off'
                                    : 'i-mdi-volume'
                            "
                        />
                    </UButton>
                </UTooltip>
            </span>

            <Transition name="fade">
                <span
                    v-if="state.isLoading"
                    class="absolute inset-0 flex justify-center items-center bg-gray-800 text-gray-100"
                >
                    <Loader class="size-6" />
                </span>
            </Transition>
        </div>
    </Contain>
</template>
