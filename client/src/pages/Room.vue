<script setup lang="ts">
import {
    computed,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    toValue,
    watch
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import RoomControlButton from '../components/room/RoomControlButton.vue';
import Settings from '../components/Settings.vue';
import Participant from '../components/room/Participant.vue';
import { useMediaStream } from '../composables/use-media-stream';
import { useRoom } from '../composables/use-room';
import { useSettingsStore } from '../composables/store/use-settings-store';
import Placeholder from '../components/base/Placeholder.vue';
import ParticipantGrid from '../components/room/ParticipantGrid.vue';
import { debounce } from '../utils/helpers';

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

const participantId = crypto.randomUUID();

const router = useRouter();

const {
    params: { roomId }
} = useRoute();

const { displayName, videoDeviceId, audioDeviceId } = useSettingsStore();

const {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    enableStream,
    disableStream,
    toggleVideo,
    toggleAudio
} = useMediaStream();

const localParticipant = ref<ClientParticipant>({
    id: participantId,
    name: displayName.value,
    stream: null,
    isMuted: false
});

const { participants, startCall, stopCall } = useRoom({
    roomId: roomId as string,
    localParticipantRef: localParticipant,
    streamRef: stream
});

const state = reactive<State>({
    viewMode: 'sidebar',
    areSettingsVisible: false,
    activeParticipantId: null
});

const allParticipants = computed(() => [
    localParticipant.value,
    ...participants.value
]);

const activeParticipant = computed(() => {
    return allParticipants.value.find(
        ({ id }) => id === state.activeParticipantId
    );
});

const areDevicesReady = computed(
    () => audioDeviceId.value && videoDeviceId.value
);

function toggleSettings() {
    state.areSettingsVisible = !state.areSettingsVisible;
}

function isViewMode(mode: ViewMode) {
    return state.viewMode === mode;
}

function toggleViewMode() {
    state.viewMode = isViewMode('grid') ? 'sidebar' : 'grid';
}

function isLocalParticipant(id: string) {
    return id === localParticipant.value.id;
}

function isActiveParticipant(id: string) {
    return id === state.activeParticipantId;
}

function setActiveParticipant(id: string) {
    state.activeParticipantId = id;
}

function toggleMuteParticipant(participantId: string) {
    const participant = participants.value.find(
        ({ id }) => id === participantId
    );

    if (participant) {
        participant.isMuted = !participant.isMuted;
    }
}

async function fetchLocalStream() {
    await enableStream({
        video: {
            deviceId: toValue(videoDeviceId)
        },
        audio: {
            deviceId: toValue(audioDeviceId)
        }
    });
}

function leaveRoom() {
    stopCall();

    disableStream();

    router.push('/');
}

watch(stream, () => {
    localParticipant.value.stream = stream.value;

    if (stream.value) {
        startCall();
    }
});

watch(
    displayName,
    debounce((name: string) => {
        localParticipant.value = { ...localParticipant.value, name };
    }, 1000)
);

watch(isAudioEnabled, (isEnabled) => {
    localParticipant.value = { ...localParticipant.value, isMuted: !isEnabled };
});

watch(participants, (currentParticipants) => {
    const lastParticipant = currentParticipants.at(-1);

    if (lastParticipant) {
        setActiveParticipant(lastParticipant.id);
    } else {
        setActiveParticipant(localParticipant.value.id);
    }
});

watch([videoDeviceId, audioDeviceId], fetchLocalStream);

onMounted(() => {
    if (areDevicesReady.value) {
        fetchLocalStream();
    } else {
        toggleSettings();
    }
});

onBeforeUnmount(() => {
    stopCall();

    disableStream();
});
</script>

<template>
    <section class="flex flex-col grow gap-4 p-4">
        <div class="relative flex grow gap-4">
            <div v-if="isViewMode('sidebar')" class="flex flex-col grow gap-4">
                <Participant
                    v-if="activeParticipant"
                    v-bind="activeParticipant"
                    :is-active-participant="true"
                    @toggle-mute="toggleMuteParticipant(activeParticipant.id)"
                />

                <Placeholder
                    v-else
                    class="grow bg-gray-800 text-gray-100 rounded"
                    icon="i-mdi-video"
                    text="Awaiting participants..."
                />
            </div>

            <div
                v-if="isViewMode('sidebar') && allParticipants.length > 1"
                class="w-64 relative h-full overflow-y-auto"
            >
                <ul class="flex flex-col gap-4">
                    <template
                        v-for="{ id, ...participant } of allParticipants"
                        :key="id"
                    >
                        <li>
                            <Participant
                                :class="{ hidden: isActiveParticipant(id) }"
                                v-bind="participant"
                                :is-local-participant="isLocalParticipant(id)"
                                :use-content-ratio="true"
                                @toggle-mute="toggleMuteParticipant(id)"
                                @click="setActiveParticipant(id)"
                            />
                        </li>
                    </template>
                </ul>
            </div>

            <ParticipantGrid
                v-else-if="isViewMode('grid')"
                class="grow"
                :items="allParticipants"
            >
                <template #item="{ id, ...participant }">
                    <Participant
                        v-bind="participant"
                        :is-local-participant="isLocalParticipant(id)"
                        @toggle-mute="toggleMuteParticipant(id)"
                    />
                </template>
            </ParticipantGrid>
        </div>

        <div class="flex justify-center items-end gap-4">
            <RoomControlButton
                :icon="isVideoEnabled ? 'i-mdi-video' : 'i-mdi-video-off'"
                @click="toggleVideo"
            />
            <RoomControlButton
                :icon="
                    isAudioEnabled ? 'i-mdi-microphone' : 'i-mdi-microphone-off'
                "
                @click="toggleAudio"
            />
            <RoomControlButton
                class="w-16 h-16 text-gray-100 bg-red-900"
                icon="i-mdi-phone-off"
                @click="leaveRoom"
            />
            <RoomControlButton icon="i-mdi-cog" @click="toggleSettings" />
            <RoomControlButton
                :icon="viewModeIcons[state.viewMode]"
                @click="toggleViewMode"
            />
        </div>

        <USlideover
            title="Settings"
            v-model:open="state.areSettingsVisible"
            :ui="{ body: 'flex flex-col' }"
        >
            <template #body>
                <Settings @close="toggleSettings" />
            </template>
        </USlideover>
    </section>
</template>
