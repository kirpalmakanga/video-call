<script setup lang="ts">
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import { useAuthStore } from '../../composables/store/use-auth-store';
import { loginSchema, type LoginFormData } from '../../utils/validation';

const toast = useToast();

const authStore = useAuthStore();
const { logIn } = authStore;

const state = reactive<LoginFormData>({
    email: '',
    password: ''
});

async function onSubmit({ data }: FormSubmitEvent<LoginFormData>) {
    try {
        await logIn(data);
    } catch (error: any) {
        toast.add({
            title: 'Failed signing in.',
            description:
                error?.response?.data.error ||
                `Couldn't log in, verify your email and password.`,
            color: 'error'
        });
    }
}
</script>

<template>
    <UForm
        @submit="onSubmit"
        :schema="loginSchema"
        :state="state"
        class="flex flex-col gap-4"
    >
        <UFormField label="Email" name="email" :ui="{ label: 'font-bold' }">
            <UInput
                class="w-full"
                variant="soft"
                v-model="state.email"
                type="email"
            />
        </UFormField>

        <UFormField
            label="Password"
            name="password"
            :ui="{ label: 'font-bold' }"
        >
            <UInput
                class="w-full"
                variant="soft"
                v-model="state.password"
                type="password"
            />
        </UFormField>

        <UButton class="self-end" type="submit">Submit</UButton>
    </UForm>
</template>
