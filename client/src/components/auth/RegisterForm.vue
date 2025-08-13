<script setup lang="ts">
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import { useRouter } from 'vue-router';
import { registerSchema, type RegisterFormData } from '../../utils/validation';
import { register } from '../../utils/api';

const router = useRouter();
const toast = useToast();

const state = reactive<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
});

async function onSubmit({ data }: FormSubmitEvent<RegisterFormData>) {
    try {
        await register(data);

        router.replace('/');
    } catch (error: any) {
        toast.add({
            title: 'Registering failed',
            description:
                error?.response?.data.error ||
                `Couldn't register, check your credentials.`,
            color: 'error'
        });
    }
}
</script>

<template>
    <UForm
        class="flex flex-col gap-4"
        :schema="registerSchema"
        :state="state"
        @submit="onSubmit"
    >
        <UFormField
            label="First name"
            name="firstName"
            :ui="{ label: 'font-bold' }"
        >
            <UInput class="w-full" variant="soft" v-model="state.firstName" />
        </UFormField>

        <UFormField
            label="Last name"
            name="lastName"
            :ui="{ label: 'font-bold' }"
        >
            <UInput class="w-full" variant="soft" v-model="state.lastName" />
        </UFormField>

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

        <UFormField
            label="Password"
            name="confirmPassword"
            :ui="{ label: 'font-bold' }"
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
