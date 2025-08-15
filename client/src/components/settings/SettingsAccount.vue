<script setup lang="ts">
import { reactive } from 'vue';
import {
    updatePasswordSchema,
    type UpdatePasswordFormData
} from '../../utils/validation';
import type { FormSubmitEvent } from '@nuxt/ui';
import { updatePassword } from '../../services/api';
import { useAuthStore } from '../../composables/store/use-auth-store';

const toast = useToast();

const { email } = useAuthStore();

const state = reactive<UpdatePasswordFormData>({
    currentPassword: '',
    password: '',
    confirmPassword: ''
});

async function onSubmit({
    data: { password }
}: FormSubmitEvent<UpdatePasswordFormData>) {
    try {
        await updatePassword(password);

        toast.add({
            title: 'Success',
            description: `Updated password.`
        });
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description:
                error?.response?.data.error || `Couldn't update password.`,
            color: 'error'
        });
    }
}
</script>

<template>
    <h2 class="font-bold mb-6">Account</h2>

    <UForm
        class="flex flex-col gap-4"
        :schema="updatePasswordSchema"
        :state="state"
        @submit="onSubmit"
    >
        <input type="hidden" name="email" :value="email" />

        <PasswordField
            label="Current password"
            name="currentPassword"
            v-model="state.currentPassword"
        />

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
            icon="i-mdi-content-save-outline"
            type="submit"
        >
            Save modifications
        </UButton>
    </UForm>
</template>
