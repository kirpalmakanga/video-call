<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { useAuthStore } from '../../composables/store/use-auth-store';
import { storeToRefs } from 'pinia';
import { isEqual } from '../../utils/helpers';
import { object, string, type InferType } from 'yup';

const authStore = useAuthStore();
const { updateUserProfile } = authStore;
const { firstName, lastName } = storeToRefs(authStore);

const schema = object({
    firstName: string().required('Required'),
    lastName: string().required('Required')
});

type Schema = InferType<typeof schema>;

const currentState = computed(() => ({
    firstName: firstName.value,
    lastName: lastName.value
}));

const state = reactive<Schema>({ ...currentState.value });

const profileHasBeenUpdated = computed(() => {
    return !isEqual(state, currentState.value);
});

function onSubmit() {
    updateUserProfile(state);
}
</script>

<template>
    <UForm
        :schema="schema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="onSubmit"
    >
        <UFormField label="First name" :ui="{ label: 'font-bold' }">
            <UInput variant="soft" v-model="state.firstName" />
        </UFormField>

        <UFormField label="Last name" :ui="{ label: 'font-bold' }">
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
