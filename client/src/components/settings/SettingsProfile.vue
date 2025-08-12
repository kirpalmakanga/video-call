<script setup lang="ts">
import { computed, reactive } from 'vue';
import { useAuthStore } from '../../composables/store/use-auth-store';
import { storeToRefs } from 'pinia';
import { isEqual } from '../../utils/helpers';
import {
    updateProfileSchema,
    type UpdateProfileFormData
} from '../../utils/validation';
import type { FormSubmitEvent } from '@nuxt/ui';

const toast = useToast();

const authStore = useAuthStore();
const { updateUserProfile } = authStore;
const { firstName, lastName } = storeToRefs(authStore);

const currentState = computed(() => ({
    firstName: firstName.value,
    lastName: lastName.value
}));

const state = reactive<UpdateProfileFormData>({ ...currentState.value });

const profileHasBeenUpdated = computed(() => {
    return !isEqual(state, currentState.value);
});

async function onSubmit({ data }: FormSubmitEvent<UpdateProfileFormData>) {
    try {
        await updateUserProfile(data);

        toast.add({
            title: 'Success',
            description: `Updated profile settings.`
        });
    } catch (error: any) {
        toast.add({
            title: 'Failed signing in',
            description:
                error?.response?.data.error || `Couldn't save profile.`,
            color: 'error'
        });
    }
}
</script>

<template>
    <h2 class="font-bold mb-6">Profile</h2>

    <UForm
        class="flex flex-col gap-4"
        :schema="updateProfileSchema"
        :state="state"
        @submit="onSubmit"
    >
        <UFormField
            label="First name"
            :ui="{ label: 'font-bold' }"
            name="firstName"
        >
            <UInput variant="soft" v-model="state.firstName" />
        </UFormField>

        <UFormField
            label="Last name"
            :ui="{ label: 'font-bold' }"
            name="lastName"
        >
            <UInput variant="soft" v-model="state.lastName" />
        </UFormField>

        <UButton
            class="self-end"
            icon="i-mdi-content-save-outline"
            type="submit"
            :disabled="!profileHasBeenUpdated"
        >
            Save modifications
        </UButton>
    </UForm>
</template>
