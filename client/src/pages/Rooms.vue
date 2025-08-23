<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Placeholder from '../components/base/Placeholder.vue';
import RoomsGrid from '../components/RoomsGrid.vue';
import RoomsGridSkeleton from '../components/RoomsGridSkeleton.vue';
import { useRoomsListQuery } from '../services/queries';
import CreateRoomButton from '../components/CreateRoomButton.vue';
import PageError from '../components/page/PageError.vue';
import type { TabsItem } from '@nuxt/ui';
import { useAuthStore } from '../composables/store/use-auth-store';
import { storeToRefs } from 'pinia';

const router = useRouter();
const route = useRoute();

const { data: rooms, isLoading, error, refetch } = useRoomsListQuery();

const authStore = useAuthStore();
const { id: currentUserId } = storeToRefs(authStore);

const tabs: TabsItem[] = [
    {
        label: 'All',
        value: '/rooms'
    },
    {
        label: 'Favorites',
        value: '/rooms/favorites'
    },
    {
        label: 'Created',
        value: '/rooms/created'
    }
];

const activeTab = computed<string>({
    get() {
        return route.path;
    },
    set(path) {
        filter.value = '';

        router.push({ path });
    }
});

const filter = ref<string>('');

const currentRooms = computed<Room[]>(() => {
    let items: Room[] = rooms.value || [];

    if (filter.value) {
        items = items.filter(({ name }) => {
            name.toLowerCase().includes(filter.value.toLowerCase());
        });
    }

    switch (route.params.tab) {
        case 'created':
            items = items.filter((room: Room) => {
                return room.creator.id === currentUserId.value;
            });
            break;

        case 'favorites':
            items = items.filter((room: Room) => {
                return room.isFavorite;
            });
            break;
    }

    return items;
});
</script>

<template>
    <div class="flex grow md:justify-center">
        <div class="flex flex-col md:rounded p-4 w-full">
            <div class="flex items-center gap-2 mb-4">
                <h1 class="grow font-bold text-neutral-100">Available rooms</h1>

                <CreateRoomButton />
            </div>

            <UTabs
                v-model="activeTab"
                :content="false"
                :items="tabs"
                class="w-full mb-4"
            />

            <SearchForm
                class="bg-gray-900 p-4 rounded mb-4"
                label="Find a room"
                v-model="filter"
            />

            <RoomsGridSkeleton v-if="isLoading" />

            <PageError v-else-if="error" @reload="refetch" />

            <RoomsGrid v-else-if="rooms?.length" :items="currentRooms" />

            <Placeholder
                v-else
                class="bg-slate-700 text-neutral-100 rounded"
                icon="i-mdi-format-list-bulleted"
                text="No available rooms."
            />
        </div>
    </div>
</template>
