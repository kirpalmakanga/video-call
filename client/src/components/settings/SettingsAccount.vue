<script setup lang="ts">
import { reactive } from 'vue';
import {
    updatePasswordSchema,
    type UpdatePasswordFormData
} from '../../utils/validation';
import type { FormSubmitEvent } from '@nuxt/ui';
import { updatePassword } from '../../utils/api';
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

        <UFormField
            label="Current password"
            :ui="{ label: 'font-bold' }"
            name="currentPassword"
        >
            <UInput
                variant="soft"
                v-model="state.currentPassword"
                type="password"
            />
        </UFormField>

        <UFormField
            label="New password"
            :ui="{ label: 'font-bold' }"
            name="password"
        >
            <UInput variant="soft" v-model="state.password" type="password" />
        </UFormField>

        <UFormField
            label="Confirm new password"
            :ui="{ label: 'font-bold' }"
            name="confirmPassword"
        >
            <UInput
                variant="soft"
                v-model="state.confirmPassword"
                type="password"
            />
        </UFormField>

        <UButton
            class="self-end"
            icon="i-mdi-content-save-outline"
            type="submit"
        >
            Save modifications
        </UButton>
    </UForm>
</template>
