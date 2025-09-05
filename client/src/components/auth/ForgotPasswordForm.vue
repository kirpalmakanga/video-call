<script setup lang="ts">
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import EmailField from '../form/EmailField.vue';
import { requestPasswordReset } from '../../services/api';
import {
    forgotPasswordSchema,
    type ForgotPasswordFormData
} from '../../utils/validation';

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
        class="flex flex-col gap-4"
        :schema="forgotPasswordSchema"
        :state="state"
        @submit="onSubmit"
    >
        <template #default="{ loading }">
            <EmailField label="Email" name="email" v-model="state.email" />

            <UButton
                class="self-end"
                type="submit"
                icon="i-mdi-send-variant-outline"
                :loading="loading"
            >
                {{ loading ? 'Sending...' : 'Send' }}
            </UButton>
        </template>
    </UForm>
</template>
