<script setup lang="ts">
import { useOnline } from '@vueuse/core';
import { RouterView } from 'vue-router';

const isOnline = useOnline();
</script>

<template>
    <div
        v-if="!isOnline"
        class="flex items-center bg-warning-900 text-neutral-100 text-xs rounded mt-4 mx-4 p-2"
    >
        <UIcon class="size-5 mr-2" name="i-mdi-wifi-strength-off-outline" />
        Offline: please check your internet connection.
    </div>

    <UApp><RouterView /></UApp>
</template>
