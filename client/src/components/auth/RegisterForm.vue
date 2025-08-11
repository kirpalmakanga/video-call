<script setup lang="ts">
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../composables/store/use-auth-store';
import { registerSchema, type RegisterFormData } from '../../utils/validation';

const router = useRouter();
const toast = useToast();
const { register } = useAuthStore();

const state = reactive<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
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
        :schema="registerSchema"
        :state="state"
        class="flex flex-col gap-4"
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

        <UButton class="self-end" type="submit">Submit</UButton>
    </UForm>
</template>
