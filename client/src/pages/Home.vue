<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { useSocket } from '../composables/use-socket';
import Placeholder from '../components/base/Placeholder.vue';
import { useRoomsListQuery } from '../utils/queries';

const { subscribe, unsubscribe } = useSocket();

const { data: rooms, isLoading } = useRoomsListQuery();

function onRoomsListSync({ items }: { items: ClientRoom[] }) {
    rooms.value = items;
}

onMounted(() => subscribe('roomsListSync', onRoomsListSync));

onBeforeUnmount(() => unsubscribe('roomsListSync', onRoomsListSync));

Placeholder;
</script>

<template>
    <div class="flex grow md:justify-center md:items-center">
        <div class="md:rounded md:bg-slate-800 p-4 w-full md:w-1/2">
            <p class="text-neutral-100 mb-4">Available rooms</p>

            <template v-if="isLoading"></template>

            <ul v-else-if="rooms" class="flex flex-col gap-2">
                <li v-for="{ id, name, participantCount } of rooms">
                    <RouterLink
                        class="group flex items-center p-4 bg-slate-700 hover:bg-slate-600 text-neutral-100 rounded transition-colors"
                        :to="`/room/${id}/start`"
                    >
                        <span class="flex flex-col grow">
                            <span>{{ name }}</span>
                            <span class="flex items-center opacity-70">
                                <UIcon
                                    class="size-5 mr-1"
                                    name="i-mdi-user"
                                    aria-label="participants"
                                />
                                {{ participantCount }}
                            </span>
                        </span>

                        <UIcon
                            class="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            name="i-mdi-arrow-right"
                        />
                    </RouterLink>
                </li>
            </ul>

            <Placeholder
                v-else
                class="bg-slate-700 text-neutral-100 rounded"
                icon="i-mdi-format-list-bulleted"
                text="No available rooms."
            />
        </div>
    </div>
</template>
