<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui';
import CreateRoomButton from '../components/CreateRoomButton.vue';
import AllRooms from '../components/rooms/AllRooms.vue';
import FavoriteRooms from '../components/rooms/FavoriteRooms.vue';
import CreatedRooms from '../components/rooms/CreatedRooms.vue';

const tabs: TabsItem[] = [
    {
        label: 'All',
        value: 'all'
    },
    {
        label: 'Favorites',
        value: 'favorite'
    },
    {
        label: 'Created',
        value: 'created'
    }
];
</script>

<template>
    <div class="flex grow md:justify-center">
        <div class="flex flex-col md:rounded p-4 w-full">
            <div class="flex items-center gap-2 mb-4">
                <h1 class="grow font-bold text-neutral-100">Available rooms</h1>

                <CreateRoomButton />
            </div>

            <UTabs :items="tabs" default-value="all" class="gap-4">
                <template #content="{ item: { value } }">
                    <AllRooms v-if="value === 'all'" />
                    <FavoriteRooms v-else-if="value === 'favorite'" />
                    <CreatedRooms v-else-if="value === 'created'" />
                </template>
            </UTabs>
        </div>
    </div>
</template>
