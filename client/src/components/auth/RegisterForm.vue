<script setup lang="ts">
import { reactive } from 'vue';
import type { FormSubmitEvent } from '@nuxt/ui/runtime/types/form.js';
import { useRouter } from 'vue-router';
import { registerSchema, type RegisterFormData } from '../../utils/validation';
import { register } from '../../services/api';
import { omit } from '../../utils/helpers';
import TextField from '../form/TextField.vue';
import EmailField from '../form/EmailField.vue';
import PasswordField from '../form/PasswordField.vue';

const router = useRouter();
const toast = useToast();

function getInitialState() {
    return {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    };
}

const state = reactive<RegisterFormData>(getInitialState());

async function onSubmit({ data }: FormSubmitEvent<RegisterFormData>) {
    try {
        await register(omit(data, 'confirmPassword'));

        router.replace({
            path: '/register/success',
            query: { email: data.email }
        });
    } catch (error: any) {
        toast.add({
            title: 'Registering failed',
            description:
                error?.response?.data.error ||
                `Couldn't register, please try later.`,
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
        <TextField
            label="First name"
            name="firstName"
            v-model="state.firstName"
        />

        <TextField label="Last name" name="lastName" v-model="state.lastName" />

        <EmailField label="Email" name="email" v-model="state.email" />

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

        <UButton class="self-end" icon="i-mdi-save" type="submit">
            Submit
        </UButton>
    </UForm>
</template>
