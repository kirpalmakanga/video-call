<script setup lang="ts">
import { watch } from 'vue';
import { RouterView, useRouter, type RouteRecordNameGeneric } from 'vue-router';
import { storeToRefs } from 'pinia';
import useInterceptors from './composables/use-interceptors';
import { useAuthStore } from './composables/store/use-auth-store';
import Header from './components/Header.vue';

const router = useRouter();
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
    <UApp>
        <Header />

        <div class="container mx-auto flex flex-col grow">
            <RouterView />
        </div>
    </UApp>
</template>
