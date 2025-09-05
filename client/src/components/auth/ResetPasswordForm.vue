<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import PasswordField from '../form/PasswordField.vue';
import { useAuthStore } from '../../composables/store/use-auth-store';
import { resetPassword } from '../../services/api';
import {
    resetPasswordSchema,
    type ResetPasswordFormData
} from '../../utils/validation';

const {
    query: { email, resetToken }
} = useRoute();
const toast = useToast();

const { logIn } = useAuthStore();

const state = reactive<ResetPasswordFormData>({
    password: '',
    confirmPassword: ''
});

async function onSubmit({ data }: FormSubmitEvent<ResetPasswordFormData>) {
    try {
        await resetPassword(resetToken as string, data);

        await logIn({
            email: email as string,
            password: data.password
        });
    } catch (error: any) {
        toast.add({
            title: 'Error',
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
        class="flex flex-col gap-4"
        :schema="resetPasswordSchema"
        :state="state"
        @submit="onSubmit"
    >
        <template #default="{ loading }">
            <input type="hidden" name="email" :value="email" />

            <PasswordField
                label="Password"
                name="password"
                v-model="state.password"
            />

            <PasswordField
                label="Confirm password"
                name="confirmPassword"
                v-model="state.confirmPassword"
            />

            <UButton
                class="self-end"
                type="submit"
                icon="i-mdi-send-variant-outline"
                :loading="loading"
            >
                {{ loading ? 'Saving...' : 'Save' }}
            </UButton>
        </template>
    </UForm>
</template>
