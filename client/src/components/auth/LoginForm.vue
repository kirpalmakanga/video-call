<script setup lang="ts">
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import EmailField from '../form/EmailField.vue';
import PasswordField from '../form/PasswordField.vue';
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
        <EmailField label="Email" name="email" v-model="state.email" />

        <PasswordField
            label="Password"
            name="password"
            v-model="state.password"
        />

        <UButton class="self-end" type="submit">Submit</UButton>
    </UForm>
</template>
