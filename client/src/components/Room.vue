<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import Icon from './base/Icon.vue';
import ControlButton from './base/ControlButton.vue';
import Settings from './Settings.vue';
import CallerScreen from './RoomUser.vue';
import { useCall } from '../composables/use-call';

const {
    users,
    isConnecting,
    isConnected,
    areUserDevicesReady,
    isCameraDisabled,
    isMicrophoneDisabled,
    startCall,
    stopCall,
    toggleCamera,
    toggleMicrophone
} = useCall();

interface State {
    viewMode: 'sidebar' | 'grid';
    areSettingsVisible: boolean;
    activeUserId: string | null;
}

const state = reactive<State>({
    viewMode: 'sidebar',
    areSettingsVisible: false,
    activeUserId: null
});

const selectedUser = computed(() =>
    users.value.find(({ id }) => id === state.activeUserId)
);

function toggleSettings() {
    state.areSettingsVisible = !state.areSettingsVisible;
}

function toggleViewMode() {
    state.viewMode = state.viewMode === 'grid' ? 'sidebar' : 'grid';
}

function toggleCall() {
    if (isConnected.value) {
        stopCall();
    } else if (areUserDevicesReady.value) {
        startCall();
    } else {
        toggleSettings();
    }
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

watch(users, (currentUsers) => {
    if (state.activeUserId || !currentUsers.length) {
        return;
    }

    const [{ id } = { id: null }] = currentUsers;

    if (id) {
        setActiveUser(id);
    }
});

watch(isConnected, () => {
    const { id } = users.value.at(-1) || { id: null };

    if (id && !state.activeUserId) {
        setActiveUser(id);
    }
});
</script>

<template>
    <div class="flex flex-col flex-grow gap-4 p-4">
        <div class="relative flex flex-grow gap-4">
            <section
                :class="{
                    'flex flex-col flex-grow gap-4':
                        state.viewMode === 'sidebar',
                    'absolute bottom-4 left-4 w-32 aspect-video':
                        state.viewMode === 'grid'
                }"
            >
                <Transition name="fade" mode="out-in">
                    <CallerScreen
                        v-if="selectedUser"
                        v-bind="selectedUser"
                        :is-active-user="true"
                        @toggle-mute="toggleMuteUser(selectedUser.id)"
                    />

                    <div
                        v-else
                        class="flex flex-col flex-grow items-center justify-center bg-gray-800 text-gray-100"
                    >
                        <Icon class="w-12 h-12" name="camera" />

                        <p>Awaiting participants...</p>
                    </div>
                </Transition>
            </section>

            <div v-if="users.length > 1" class="w-64 relative">
                <ul
                    :class="{
                        'absolute inset-0 flex flex-col gap-4 overflow-y-auto h-full':
                            state.viewMode === 'sidebar',
                        '': state.viewMode === 'grid'
                    }"
                >
                    <template v-for="{ id, ...user } of users" :key="id">
                        <li>
                            <CallerScreen
                                class="block transition-transform shadow cursor-pointer"
                                :class="{
                                    hidden: isActiveUser(id),
                                    'hover:scale-90 hover:active:scale-100':
                                        state.viewMode === 'sidebar'
                                }"
                                v-bind="user"
                                @click="setActiveUser(id)"
                                @toggle-mute="toggleMuteUser(id)"
                            />
                        </li>
                    </template>
                </ul>
            </div>
        </div>

        <div class="flex justify-center items-end gap-4">
            <ControlButton
                :icon="isCameraDisabled ? 'camera-off' : 'camera'"
                @click="toggleCamera"
            />
            <ControlButton
                :icon="isMicrophoneDisabled ? 'microphone-off' : 'microphone'"
                @click="toggleMicrophone"
            />
            <ControlButton
                class="w-16 h-16 text-gray-100"
                :class="isConnected ? 'bg-red-900' : 'bg-green-900'"
                :icon="isConnected ? 'call-off' : 'call'"
                :is-loading="isConnecting"
                :disabled="isConnecting"
                @click="toggleCall"
            />
            <ControlButton icon="settings" @click="toggleSettings" />
            <ControlButton :icon="state.viewMode" @click="toggleViewMode" />
        </div>

        <Settings
            :is-visible="state.areSettingsVisible"
            @close="toggleSettings"
        />
    </div>
</template>
