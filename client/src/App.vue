<script setup lang="ts">
import { onMounted, watch } from 'vue';
import {
    RouterView,
    useRoute,
    useRouter,
    type RouteRecordNameGeneric
} from 'vue-router';
import { storeToRefs } from 'pinia';
import { useOnline } from '@vueuse/core';
import useInterceptors from './composables/use-interceptors';
import { useAuthStore } from './composables/store/use-auth-store';
import Header from './components/Header.vue';

const router = useRouter();
const isOnline = useOnline();
const authStore = useAuthStore();
const { isLoggedIn } = storeToRefs(authStore);

useInterceptors();

function isAuthRoute(name: RouteRecordNameGeneric) {
    return name && ['login', 'register'].includes(name.toString());
}

router.beforeEach(({ name }, _, next) => {
    if (!isLoggedIn.value && !isAuthRoute(name)) {
        next({ name: 'login' });
    } else if (isLoggedIn.value && isAuthRoute(name)) {
        next({ name: 'home' });
    } else {
        next();
    }
});

watch(isLoggedIn, () => {
    if (isLoggedIn.value) {
        router.replace('/');
    } else {
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

    <UApp>
        <Header />

        <RouterView />
    </UApp>
</template>
