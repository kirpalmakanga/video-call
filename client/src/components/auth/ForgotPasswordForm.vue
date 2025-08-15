<script setup lang="ts">
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import {
    forgotPasswordSchema,
    type ForgotPasswordFormData
} from '../../utils/validation';
import { requestPasswordReset } from '../../services/api';

const toast = useToast();

const state = reactive<ForgotPasswordFormData>({
    email: ''
});

async function onSubmit({
    data: { email }
}: FormSubmitEvent<ForgotPasswordFormData>) {
    try {
        await requestPasswordReset(email);

        toast.add({
            title: 'Success',
            description: 'A reset link has been sent to your inbox.'
        });
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description:
                error?.response?.data.error ||
                `Couldn't send reset link, please try later.`,
            color: 'error'
        });
    }
}
</script>

<template>
    <UForm
        @submit="onSubmit"
        :schema="forgotPasswordSchema"
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

        <UButton class="self-end" type="submit">Submit</UButton>
    </UForm>
</template>
