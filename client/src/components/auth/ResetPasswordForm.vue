<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import {
    resetPasswordSchema,
    type ResetPasswordFormData
} from '../../utils/validation';
import { resetPassword } from '../../services/api';

const router = useRouter();
const {
    params: { resetToken }
} = useRoute();
const toast = useToast();

const state = reactive<ResetPasswordFormData>({
    password: '',
    confirmPassword: ''
});

async function onSubmit({ data }: FormSubmitEvent<ResetPasswordFormData>) {
    try {
        await resetPassword(resetToken as string, data);

        router.replace('/login');
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
        <UFormField
            label="Password"
            :ui="{ label: 'font-bold' }"
            name="password"
        >
            <UInput
                class="w-full"
                variant="soft"
                v-model="state.password"
                type="password"
            />
        </UFormField>

        <UFormField
            label="Confirm password"
            :ui="{ label: 'font-bold' }"
            name="confirmPassword"
        >
            <UInput
                class="w-full"
                variant="soft"
                v-model="state.confirmPassword"
                type="password"
            />
        </UFormField>

        <UButton class="self-end" type="submit">Submit</UButton>
    </UForm>
</template>
