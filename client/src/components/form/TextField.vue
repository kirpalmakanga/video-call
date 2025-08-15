<script setup lang="ts">
defineProps<{ label: string; name: string }>();

const model = defineModel<string>();
</script>

<template>
    <UFormField :label="label" :name="name" :ui="{ label: 'font-bold' }">
        <UInput class="w-full" variant="soft" v-model="model" />
    </UFormField>
</template>
