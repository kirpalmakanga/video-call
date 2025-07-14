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

import ControlButton from '../components/base/ControlButton.vue';
import Settings from '../components/Settings.vue';
import Participant from '../components/room/Participant.vue';
import { useMediaStream } from '../composables/use-media-stream';
import { useRoom } from '../composables/use-room';
import { useSettingsStore } from '../composables/store/use-settings-store';
import Placeholder from '../components/base/Placeholder.vue';
import ParticipantGrid from '../components/room/ParticipantGrid.vue';

type ViewMode = 'sidebar' | 'grid';

interface State {
    viewMode: ViewMode;
    areSettingsVisible: boolean;
    activeParticipantId: string | null;
}

const userId = crypto.randomUUID();

const router = useRouter();

const {
    params: { roomId }
} = useRoute();

const { videoDeviceId, audioDeviceId } = useSettingsStore();

const {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    enableStream,
    disableStream,
    toggleVideo,
    toggleAudio
} = useMediaStream();

const localParticipant = ref<ClientUser>({
    id: userId,
    name: `user_${userId}`,
    stream: null,
    isMuted: false
});

const { users, startCall, stopCall, sendMicrophoneStatus } = useRoom({
    roomId: roomId as string,
    userRef: localParticipant,
    streamRef: stream
});

const state = reactive<State>({
    viewMode: 'sidebar',
    areSettingsVisible: false,
    activeParticipantId: null
});

const allParticipants = computed(() => [
    localParticipant.value,
    ...users.value
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

function toggleMuteUser(userId: string) {
    const user = users.value.find(({ id }) => id === userId);

    if (user) {
        user.isMuted = !user.isMuted;
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

watch(isAudioEnabled, (isEnabled) => sendMicrophoneStatus(!isEnabled));

watch(users, (currentUsers) => {
    const lastUser = currentUsers.at(-1);

    if (lastUser) {
        setActiveParticipant(lastUser.id);
    } else {
        setActiveParticipant(localParticipant.value.id);
    }
});

watch([videoDeviceId, audioDeviceId], fetchLocalStream);

onMounted(fetchLocalStream);

onBeforeUnmount(() => {
    stopCall();

    disableStream();
});
</script>

<template>
    <section class="flex flex-col flex-grow gap-4 p-4">
        <div class="relative flex flex-grow gap-4">
            <div
                v-if="isViewMode('sidebar')"
                class="flex flex-col flex-grow gap-4"
            >
                <Participant
                    v-if="activeParticipant"
                    v-bind="activeParticipant"
                    :is-active-participant="true"
                    @toggle-mute="toggleMuteUser(activeParticipant.id)"
                />

                <Placeholder
                    v-else
                    class="grow bg-gray-800 text-gray-100 rounded"
                    icon="camera"
                    text="Awaiting participants..."
                />
            </div>

            <div
                v-if="isViewMode('sidebar') && allParticipants.length > 1"
                class="w-64 relative h-full overflow-y-auto"
            >
                <ul class="flex flex-col gap-4">
                    <template
                        v-for="{ id, ...user } of allParticipants"
                        :key="id"
                    >
                        <li>
                            <Participant
                                class="block hover:scale-90 hover:active:scale-100 transition-transform shadow"
                                :class="{ hidden: isActiveParticipant(id) }"
                                v-bind="user"
                                :is-local-participant="isLocalParticipant(id)"
                                @toggle-mute="toggleMuteUser(id)"
                                @click="setActiveParticipant(id)"
                            />
                        </li>
                    </template>
                </ul>
            </div>

            <ParticipantGrid
                v-else-if="isViewMode('grid')"
                class="grow"
                :users="allParticipants"
            >
                <template #item="{ id, ...user }">
                    <Participant
                        class="block shadow"
                        v-bind="user"
                        :is-local-participant="isLocalParticipant(id)"
                        @toggle-mute="toggleMuteUser(id)"
                    />
                </template>
            </ParticipantGrid>
        </div>

        <div class="flex justify-center items-end gap-4">
            <ControlButton
                :icon="isVideoEnabled ? 'camera' : 'camera-off'"
                @click="toggleVideo"
            />
            <ControlButton
                :icon="isAudioEnabled ? 'microphone' : 'microphone-off'"
                @click="toggleAudio"
            />
            <ControlButton
                class="w-16 h-16 text-gray-100 bg-red-900"
                icon="call-off"
                @click="leaveRoom"
            />
            <ControlButton icon="settings" @click="toggleSettings" />
            <ControlButton :icon="state.viewMode" @click="toggleViewMode" />
        </div>

        <Settings
            :is-visible="state.areSettingsVisible"
            @close="toggleSettings"
        />
    </section>
</template>
