<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useOnline } from '@vueuse/core';

import Placeholder from '../components/base/Placeholder.vue';
import { useRoomQuery } from '../utils/queries';
import RoomContainer from '../components/room/RoomContainer.vue';
import PageError from '../components/page/PageError.vue';

const router = useRouter();

const {
    params: { roomId }
} = useRoute();

const { data: room, isLoading, error } = useRoomQuery(roomId as string);

const isOnline = useOnline();
</script>

<template>
    <section class="flex flex-col grow gap-4 p-4">
        <UAlert
            v-if="!isOnline"
            color="error"
            title="Offline: please check your internet connection."
            icon="i-mdi-wifi-strength-off-outline"
        />

        <template v-if="isLoading">
            <USkeleton class="grow" />

            <div class="flex justify-between">
                <USkeleton class="h-8 w-29" />

                <div class="flex gap-4">
                    <USkeleton class="h-8 w-10" />
                    <USkeleton class="h-8 w-10" />
                </div>
            </div>
        </template>

        <PageError v-else-if="error" />

        <template v-else-if="room">
            <h1 class="text-xl font-bold">{{ room.name }}</h1>

            <RoomContainer :roomId="room.id" @leave="router.push('/')" />
        </template>

        <Placeholder
            v-else
            class="grow bg-slate-700 text-neutral-100 rounded"
            icon="i-mdi-alert-circle"
            text="Room not found."
        />
    </section>
</template>
