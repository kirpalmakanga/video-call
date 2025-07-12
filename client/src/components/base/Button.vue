<script setup lang="ts">
import Icon from './Icon.vue';
import LoadingIcon from './LoadingIcon.vue';

withDefaults(defineProps<{ icon?: string; isLoading?: boolean }>(), {
    isLoading: false
});
</script>

<template>
    <button
        class="relative flex items-center gap-2 bg-gray-200 hover:bg-gray-400 text-gray-900 px-3 py-1 rounded shadow transition disabled:opacity-60 whitespace-nowrap"
        :disabled="isLoading"
    >
        <LoadingIcon class="w-5 h-5" v-if="isLoading" />

        <template v-else>
            <Icon v-if="icon" class="w-5 h-5" :name="icon" />

            <slot />
        </template>
    </button>
</template>
