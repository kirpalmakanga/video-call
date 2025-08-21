<script setup lang="ts">
import { RouterLink } from 'vue-router';
import RoomsGridSkeleton from './RoomsGridSkeleton.vue';

defineProps<{
    id: string;
    name: string;
    creator: { id: string; firstName: string; lastName: string };
}>();
</script>

<template>
    <RouterLink
        class="group flex flex-col items-center text-neutral-100 rounded transition-colors overflow-hidden"
        :to="`/room/${id}/setup`"
    >
        <span
            class="aspect-video bg-gray-900 flex items-center justify-center w-full"
        >
            <UIcon class="size-8" name="i-mdi-account-group" />
        </span>

        <span
            class="flex flex-col grow bg-gray-700 group-hover:bg-gray-600 w-full p-3 transition-colors gap-2"
        >
            <span class="leading-none">{{ name }}</span>

            <span class="text-xs leading-none">
                Hosted by: {{ creator.firstName }} {{ creator.lastName }}
            </span>
        </span>
    </RouterLink>
</template>
