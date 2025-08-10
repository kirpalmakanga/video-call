<script setup lang="ts">
defineProps<{ icon: string; text: string }>();
</script>

<template>
    <div class="flex flex-col items-center justify-center p-4">
        <UIcon class="w-12 h-12" :name="icon" />

        <p class="mb-4">{{ text }}</p>

        <slot />
    </div>
</template>
