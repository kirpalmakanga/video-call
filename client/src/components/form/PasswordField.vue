<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ label: string; name: string }>();

const model = defineModel<string>();

const isPasswordVisible = ref<boolean>(false);
</script>

<template>
    <UFormField :label="label" :name="name" :ui="{ label: 'font-bold' }">
        <UInput
            class="w-full"
            icon="i-mdi-key-outline"
            variant="soft"
            v-model="model"
            :type="isPasswordVisible ? 'text' : 'password'"
        >
            <template #trailing>
                <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="
                        isPasswordVisible
                            ? 'i-mdi-eye-off-outline'
                            : 'i-mdi-eye-outline'
                    "
                    :aria-label="
                        isPasswordVisible ? 'Hide password' : 'Show password'
                    "
                    :aria-pressed="isPasswordVisible"
                    aria-controls="password"
                    @click="isPasswordVisible = !isPasswordVisible"
                />
            </template>
        </UInput>
    </UFormField>
</template>
