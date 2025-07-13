<script setup lang="ts">
import { RouterLink } from 'vue-router';
</script>

<template>
    <div class="flex grow md:justify-center md:items-center">
        <div class="md:rounded md:bg-slate-800 p-4 w-full md:w-1/2">
            <p class="text-neutral-100 mb-4">Available rooms</p>

            <ul class="flex flex-col gap-2">
                <li>
                    <RouterLink
                        class="flex flex-col p-4 bg-slate-700 hover:bg-slate-600 text-neutral-100 rounded"
                        to="/room/room1"
                    >
                        <span>Test room</span>
                        <span class="opacity-70">0 users</span>
                    </RouterLink>
                </li>
            </ul>
        </div>
    </div>
</template>
