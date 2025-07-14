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
import CallerScreen from '../components/room/RoomUser.vue';
import { useMediaStream } from '../composables/use-media-stream';
import { useRoom } from '../composables/use-room';
import { useSettingsStore } from '../composables/store/use-settings-store';
import Placeholder from '../components/base/Placeholder.vue';

type ViewMode = 'sidebar' | 'grid';

interface State {
    viewMode: ViewMode;
    areSettingsVisible: boolean;
    activeUserId: string | null;
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

const currentUser = ref<ClientUser>({
    id: userId,
    name: `user_${userId}`,
    stream: null,
    isMuted: false
});

const { users, startCall, stopCall, sendMicrophoneStatus } = useRoom({
    roomId: roomId as string,
    userRef: currentUser,
    streamRef: stream
});

const state = reactive<State>({
    viewMode: 'sidebar',
    areSettingsVisible: false,
    activeUserId: null
});

const activeUser = computed(() => {
    if (state.activeUserId) {
        return users.value.find(({ id }) => id === state.activeUserId);
    }

    return currentUser.value;
});

const allUsers = computed(() => [currentUser.value, ...users.value]);

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

function isActiveUser(id: string) {
    return state.activeUserId === id;
}

function setActiveUser(id: string) {
    state.activeUserId = id;
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
    currentUser.value.stream = stream.value;

    if (stream.value) {
        startCall();
    }
});

watch(isAudioEnabled, (isEnabled) => sendMicrophoneStatus(!isEnabled));

watch(users, (currentUsers) => {
    // if (
    //     currentUsers.some(({ id }) => id === state.activeUserId) ||
    //     !currentUsers.length
    // ) {
    //     return;
    // }

    const lastUser = currentUsers.at(-1);

    if (lastUser) {
        setActiveUser(lastUser.id);
    } else {
        setActiveUser(currentUser.value.id);
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
            <section
                :class="{
                    'flex flex-col flex-grow gap-4': isViewMode('sidebar'),
                    'absolute bottom-4 left-4 w-32 aspect-video':
                        isViewMode('grid')
                }"
            >
                <CallerScreen
                    v-if="activeUser"
                    v-bind="activeUser"
                    :is-active-user="true"
                    @toggle-mute="toggleMuteUser(activeUser.id)"
                />

                <Placeholder
                    v-else
                    class="grow bg-gray-800 text-gray-100 rounded"
                    icon="camera"
                    text="Awaiting participants..."
                />
            </section>

            <aside
                v-if="allUsers.length > 1"
                class="overflow-y-auto"
                :class="{
                    'absolute inset-0': isViewMode('grid'),
                    'w-64 relative h-full': isViewMode('sidebar')
                }"
            >
                <ul class="flex flex-col gap-4">
                    <template v-for="{ id, ...user } of allUsers" :key="id">
                        <li>
                            <CallerScreen
                                class="block transition-transform shadow"
                                :class="{
                                    hidden:
                                        isActiveUser(id) &&
                                        isViewMode('sidebar'),
                                    'hover:scale-90 hover:active:scale-100':
                                        isViewMode('sidebar')
                                }"
                                v-bind="user"
                                @toggle-mute="toggleMuteUser(id)"
                                v-on="
                                    isViewMode('sidebar')
                                        ? {
                                              click: () => setActiveUser(id)
                                          }
                                        : {}
                                "
                            />
                        </li>
                    </template>
                </ul>
            </aside>
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
