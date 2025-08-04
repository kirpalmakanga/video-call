<script setup lang="ts">
import { useOnline } from '@vueuse/core';
import { RouterView, useRouter } from 'vue-router';
import useInterceptors from './composables/use-interceptors';
import { useAuthStore } from './composables/store/use-auth-store';
import { onBeforeMount, onMounted } from 'vue';
import { storeToRefs } from 'pinia';

const router = useRouter();
const isOnline = useOnline();
const authStore = useAuthStore();
const { isLoggedIn } = storeToRefs(authStore);

useInterceptors();

onMounted(() => {
    if (!isLoggedIn.value) {
        router.replace('/login');
    }
});
</script>

<template>
    <div
        v-if="!isOnline"
        class="flex items-center bg-warning-900 text-neutral-100 text-xs rounded mt-4 mx-4 p-2"
    >
        <UIcon class="size-5 mr-2" name="i-mdi-wifi-strength-off-outline" />
        Offline: please check your internet connection.
    </div>

    <UApp><RouterView /></UApp>
</template>
