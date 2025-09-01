<script setup lang="ts">
import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    useTemplateRef,
    watch
} from 'vue';
import { useFullscreen } from '@vueuse/core';
import { storeToRefs } from 'pinia';

import Placeholder from '../../components/base/Placeholder.vue';
import Participant from '../../components/room/Participant.vue';
import AutoGrid from '../../components/base/AutoGrid.vue';
import MediaSettings from './MediaSettings.vue';
import { useRoom } from '../../composables/use-room';
import { useMediaSettingsStore } from '../../composables/store/use-media-settings-store';
import { useAuthStore } from '../../composables/store/use-auth-store';
import { keepInRange, nextFrame } from '../../utils/helpers';
import { useMediaStream } from '../../composables/media/use-media-stream';
import { useScreenCapture } from '../../composables/media/use-screen-capture';
import { useVolumeControl } from '../../composables/media/use-volume-control';
import Prompt from '../base/Prompt.vue';

const props = defineProps<{ id: string; name: string }>();

const emit = defineEmits<{ leave: [e: void] }>();

const viewModeIcons = {
    grid: 'i-mdi-view-grid',
    sidebar: 'i-mdi-dock-right'
};

type ViewMode = 'sidebar' | 'grid';

interface State {
    viewMode: ViewMode;
    areSettingsVisible: boolean;
    activeParticipantId: string | null;
}
const authStore = useAuthStore();
const { fullName } = storeToRefs(authStore);

const mediaSettingsStore = useMediaSettingsStore();
const {
    audioDeviceId,
    videoDeviceId,
    isAudioEnabled,
    isVideoEnabled,
    microphoneVolume
} = storeToRefs(mediaSettingsStore);

const state = reactive<State>({
    viewMode: 'sidebar',
    areSettingsVisible: false,
    activeParticipantId: null
});

const { stream: localStream, start: startLocalStream } = useMediaStream({
    constraints: computed(() => ({
        video: {
            deviceId: videoDeviceId.value
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            deviceId: audioDeviceId.value
        }
    })),
    isVideoEnabled,
    isAudioEnabled,
    volume: microphoneVolume
});

useVolumeControl({ stream: localStream, volume: microphoneVolume });

const {
    isSharingScreen,
    start: startSharingScreen,
    stop: stopSharingScreen
} = useScreenCapture(localStream);

const {
    isConnecting,
    participants,
    toggleMuteParticipant,
    syncLocalStream,
    connect
} = useRoom(props.id, {
    localStream,
    displayName: fullName.value,
    isVideoEnabled,
    isAudioEnabled
});

const roomContainer = useTemplateRef<HTMLDivElement>('roomContainer');

const {
    isFullscreen,
    exit: exitFullscreen,
    toggle: toggleFullscreen
} = useFullscreen(roomContainer);

const isSharingScreenModalVisible = ref<boolean>(false);

const activeParticipant = computed(() => {
    return participants.value.find(
        ({ id }) => id === state.activeParticipantId
    );
});

function toggleSettings() {
    state.areSettingsVisible = !state.areSettingsVisible;
}

function isViewMode(mode: ViewMode) {
    return state.viewMode === mode;
}

function toggleViewMode() {
    state.viewMode = isViewMode('grid') ? 'sidebar' : 'grid';
}

function isActiveParticipant(id: string) {
    return id === state.activeParticipantId;
}

function setActiveParticipant(id: string | null) {
    state.activeParticipantId = id;
}

async function connectToRoom() {
    if (!localStream.value) {
        await startLocalStream();
    }

    connect();
}

function leaveRoom() {
    emit('leave');
}

async function handleWheelVolume({ deltaY }: WheelEvent) {
    await nextFrame();

    microphoneVolume.value = keepInRange(
        microphoneVolume.value + (deltaY < 0 ? 5 : -5),
        [0, 100]
    );
}

async function toggleScreenSharing() {
    if (isSharingScreen.value) {
        isSharingScreenModalVisible.value = true;
    } else {
        await startSharingScreen();
    }
}

watch(isSharingScreen, syncLocalStream);

watch(
    () => participants.value.length,
    (count) => {
        if (count === 1) {
            setActiveParticipant(null);

            return;
        }

        const lastParticipant = participants.value.at(-1);

        if (
            lastParticipant &&
            !lastParticipant.isLocalParticipant &&
            lastParticipant.id !== state.activeParticipantId
        ) {
            setActiveParticipant(lastParticipant.id);
        }
    }
);

onMounted(() => {
    if (audioDeviceId.value && videoDeviceId.value) {
        connectToRoom();
    } else {
        toggleSettings();
    }
});

onBeforeUnmount(exitFullscreen);
</script>

<template>
    <div
        class="flex flex-col grow gap-4"
        :class="{ 'bg-gray-900 p-4': isFullscreen }"
    >
        <div class="relative flex grow gap-4">
            <div
                v-if="isViewMode('sidebar')"
                class="flex flex-col grow gap-4 bg-neutral-800 bg p-4 rounded"
            >
                <Placeholder
                    v-if="isConnecting"
                    class="grow text-gray-100 rounded"
                    icon="svg-spinners:90-ring-with-bg"
                    text="Joining room..."
                />

                <Participant
                    v-else-if="activeParticipant"
                    v-bind="activeParticipant"
                    :is-active-participant="true"
                    @toggle-mute="toggleMuteParticipant(activeParticipant.id)"
                />

                <Placeholder
                    v-else
                    class="grow text-gray-100 rounded"
                    icon="i-mdi-video"
                    text="Awaiting participants..."
                />
            </div>

            <div
                v-if="isViewMode('sidebar')"
                class="w-64 relative h-full overflow-y-auto bg-neutral-800 p-4 rounded"
            >
                <ul class="flex flex-col gap-4">
                    <template
                        v-for="{ id, ...participant } of participants"
                        :key="id"
                    >
                        <li :class="{ hidden: isActiveParticipant(id) }">
                            <Participant
                                v-bind="participant"
                                :use-content-ratio="true"
                                @toggle-mute="toggleMuteParticipant(id)"
                                @click="
                                    participants.length > 1 &&
                                        setActiveParticipant(id)
                                "
                            />
                        </li>
                    </template>
                </ul>
            </div>

            <div
                v-else-if="isViewMode('grid')"
                class="flex grow bg-neutral-800 p-4 rounded"
            >
                <AutoGrid
                    class="grow"
                    :items="participants"
                    :item-key="id"
                    :item-aspect-ratio="16 / 9"
                >
                    <template #item="{ id, ...participant }">
                        <Participant
                            v-bind="participant"
                            @toggle-mute="toggleMuteParticipant(id)"
                        />
                    </template>
                </AutoGrid>
            </div>
        </div>

        <div class="flex justify-between items-end gap-4">
            <UButtonGroup>
                <UTooltip
                    :text="
                        isVideoEnabled ? 'Turn camera off' : 'Toggle camera on'
                    "
                >
                    <UButton
                        color="neutral"
                        @click="isVideoEnabled = !isVideoEnabled"
                    >
                        <UIcon
                            class="size-5"
                            :name="
                                isVideoEnabled
                                    ? 'i-mdi-video'
                                    : 'i-mdi-video-off'
                            "
                        />
                    </UButton>
                </UTooltip>

                <div class="relative group">
                    <UTooltip
                        :text="
                            isAudioEnabled
                                ? 'Disable microphone'
                                : 'Enable microphone'
                        "
                    >
                        <UButton
                            class="rounded-none"
                            color="neutral"
                            @click="isAudioEnabled = !isAudioEnabled"
                        >
                            <UIcon
                                class="size-5"
                                :name="
                                    isAudioEnabled
                                        ? 'i-mdi-microphone'
                                        : 'i-mdi-microphone-off'
                                "
                            />
                        </UButton>
                    </UTooltip>

                    <div
                        class="absolute bottom-full left-1/2 -translate-x-1/2 transition-opacity opacity-0 group-hover:opacity-100 p-4 bg-gray-900 shadow rounded"
                        @wheel="handleWheelVolume"
                    >
                        <USlider
                            class="h-48 mb-2"
                            color="neutral"
                            orientation="vertical"
                            v-model="microphoneVolume"
                        />
                    </div>
                </div>
                <UTooltip
                    :text="
                        state.viewMode === 'sidebar'
                            ? 'Switch to grid layout'
                            : 'Switch to sidebar layout'
                    "
                >
                    <UButton color="neutral" @click="toggleViewMode">
                        <UIcon
                            class="size-5"
                            :name="viewModeIcons[state.viewMode]"
                        />
                    </UButton>
                </UTooltip>

                <UTooltip text="Start sharing screen">
                    <UButton color="neutral" @click="toggleScreenSharing">
                        <UIcon
                            class="size-5"
                            name="i-ic-outline-screen-share"
                        />
                    </UButton>
                </UTooltip>
            </UButtonGroup>

            <div class="flex gap-2">
                <UTooltip text="Settings">
                    <UButton color="neutral" @click="toggleFullscreen">
                        <UIcon
                            class="size-5"
                            :name="
                                isFullscreen
                                    ? 'i-mdi-fullscreen'
                                    : 'i-mdi-fullscreen-exit'
                            "
                        />
                    </UButton>
                </UTooltip>

                <UTooltip text="Settings">
                    <UButton color="neutral" @click="toggleSettings">
                        <UIcon class="size-5" name="i-mdi-cog" />
                    </UButton>
                </UTooltip>

                <Prompt
                    :title="`Leave room: ${name}`"
                    cancel-text="Stay"
                    cancel-color="neutral"
                    confirm-color="error"
                    confirm-text="Leave"
                    @confirm="leaveRoom"
                >
                    <UTooltip text="Leave room">
                        <UButton color="error">
                            <UIcon class="size-5" name="i-mdi-phone-off" />
                        </UButton>
                    </UTooltip>
                </Prompt>
            </div>
        </div>

        <USlideover
            :room-name="name"
            title="Settings"
            v-model:open="state.areSettingsVisible"
            :ui="{ body: 'flex flex-col' }"
        >
            <template #body>
                <ScrollContainer class="grow">
                    <MediaSettings />
                </ScrollContainer>
            </template>
        </USlideover>

        <Prompt
            v-model:is-open="isSharingScreenModalVisible"
            title="Stop sharing screen ?"
            cancel-text="Continue"
            cancel-color="neutral"
            confirm-text="Stop"
            confirm-color="error"
            @confirm="stopSharingScreen"
        />
    </div>
</template>
