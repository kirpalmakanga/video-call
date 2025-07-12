<script setup lang="ts">
import Icon from './Icon.vue';
import LoadingIcon from './LoadingIcon.vue';

defineProps<{ icon: string; isLoading?: boolean }>();
</script>

<template>
    <button
        class="flex items-center justify-center bg-gray-100 transition rounded-full w-10 h-10 disabled:bg-gray-500 disabled:pointer-events-none transform hover:scale-90 hover:active:scale-100"
    >
        <LoadingIcon v-if="isLoading" class="w-1/2 h-1/2" />

        <Icon v-else class="w-1/2 h-1/2" :name="icon" />
    </button>
</template>
