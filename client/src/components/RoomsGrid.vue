<script setup lang="ts">
import { RouterLink } from 'vue-router';

defineProps<{ rooms: Room[] }>();
</script>

<template>
    <ul class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <li v-for="{ id, name, participantCount } of rooms">
            <RouterLink
                class="group flex flex-col items-center hover:bg-slate-600 text-neutral-100 rounded transition-colors overflow-hidden"
                :to="`/room/${id}/start`"
            >
                <span
                    class="aspect-video bg-slate-800 flex items-center justify-center w-full"
                >
                    <UIcon class="size-8" name="i-mdi-account-group" />
                </span>

                <span
                    class="flex flex-col grow bg-slate-700 group-hover:bg-slate-600 w-full p-3 transition-colors"
                >
                    <span>{{ name }}</span>
                    <span class="flex items-center opacity-70">
                        <UIcon
                            class="size-5 mr-1"
                            name="i-mdi-account-multiple"
                            aria-label="participants"
                        />
                        {{ participantCount }}
                    </span>
                </span>
            </RouterLink>
        </li>
    </ul>
</template>
