<script setup lang="ts">
import { object, string } from 'yup';
import type { InferType } from 'yup';
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import { useAuthStore } from '../composables/store/use-auth-store';

const toast = useToast();

const authStore = useAuthStore();
const { logIn } = authStore;

const schema = object({
    email: string().email('Invalid email').required('Required'),
    password: string()
        .min(8, 'Must be at least 8 characters')
        .required('Required')
});

type Schema = InferType<typeof schema>;

const state = reactive<Schema>({
    email: '',
    password: ''
});

async function onSubmit({ data }: FormSubmitEvent<Schema>) {
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
    <div class="flex grow items-center justify-center">
        <div class="bg-gray-900 rounded p-4 md:w-sm shadow">
            <h1 class="mb-6 font-bold text-center">Sign in</h1>

            <UForm
                :schema="schema"
                :state="state"
                class="flex flex-col gap-4"
                @submit="onSubmit"
            >
                <UFormField
                    label="Email"
                    name="email"
                    :ui="{ label: 'font-bold' }"
                >
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

            <USeparator class="my-4" />

            <p class="text-sm">
                Don't have an account ?
                <ULink class="font-bold" href="/register">Register here</ULink>
            </p>
        </div>
    </div>
</template>
