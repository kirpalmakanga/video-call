<script setup lang="ts">
defineProps<{ icon: string }>();
</script>

<template>
    <button
        class="flex items-center justify-center bg-gray-100 transition rounded-full w-10 h-10 disabled:bg-gray-500 disabled:pointer-events-none transform hover:scale-90 hover:active:scale-100"
    >
        <UIcon class="w-1/2 h-1/2 text-gray-900 fill-current" :name="icon" />
    </button>
</template>
