<script setup lang="ts">
defineProps<{ label: string; name: string }>();

const model = defineModel<string>();
</script>

<template>
    <UFormField :label="label" :name="name" :ui="{ label: 'font-bold' }">
        <UInput
            class="w-full"
            icon="i-mdi-mail-ru"
            variant="soft"
            v-model="model"
            type="email"
        />
    </UFormField>
</template>
