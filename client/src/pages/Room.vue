<script setup lang="ts">
import {
    computed,
    onBeforeMount,
    onBeforeUnmount,
    onMounted,
    reactive,
    watch
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import Placeholder from '../components/base/Placeholder.vue';
import Settings from '../components/Settings.vue';
import Participant from '../components/room/Participant.vue';
import ParticipantGrid from '../components/room/ParticipantGrid.vue';
import RoomControlButton from '../components/room/RoomControlButton.vue';
import { useRoom } from '../composables/use-room';
import { useSettingsStore } from '../composables/store/use-settings-store';
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

const router = useRouter();

const {
    params: { roomId }
} = useRoute();

const {
    displayName,
    isVideoEnabled: isSettingsVideoEnabled,
    isAudioEnabled: isSettingsAudioEnabled,
    videoDeviceId,
    audioDeviceId
} = useSettingsStore();

const {
    localParticipant,
    participants,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    toggleMuteParticipant,
    connect,
    disconnect
} = useRoom(roomId as string);

const state = reactive<State>({
    viewMode: 'sidebar',
    areSettingsVisible: false,
    activeParticipantId: null
});

const allParticipants = computed(() => [
    localParticipant,
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

function isActiveParticipant(id: string) {
    return id === state.activeParticipantId;
}

function setActiveParticipant(id: string) {
    state.activeParticipantId = id;
}

function leaveRoom() {
    router.push('/');
}

async function connectToRoom() {
    await connect({
        displayName: displayName.value,
        streamOptions: {
            video: {
                deviceId: videoDeviceId.value
            },
            audio: {
                deviceId: audioDeviceId.value
            }
        }
    });
}

watch(
    displayName,
    debounce((value: string) => {
        localParticipant.name = value;
    }, 1000)
);

watch(isVideoEnabled, (value) => {
    isSettingsVideoEnabled.value = value;
});
watch(isAudioEnabled, (value) => {
    isSettingsAudioEnabled.value = value;
});

watch(areDevicesReady, (ready) => {
    if (ready) {
        connectToRoom();
    }
});

watch(allParticipants, (currentParticipants) => {
    const lastParticipant = currentParticipants.at(-1);

    if (lastParticipant) {
        setActiveParticipant(lastParticipant.id);
    }
});

onBeforeMount(() => {
    isVideoEnabled.value = isSettingsVideoEnabled.value;
    isAudioEnabled.value = isSettingsAudioEnabled.value;
});

onMounted(() => {
    if (areDevicesReady.value) {
        connectToRoom();
    } else {
        toggleSettings();
    }
});

onBeforeUnmount(disconnect);
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
