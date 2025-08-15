<script setup lang="ts">
import { RouterView } from 'vue-router';
import Header from './components/Header.vue';
import useInterceptors from './composables/use-interceptors';
import { useAuthRouteGuard } from './composables/use-auth-route-guard';

useAuthRouteGuard();

useInterceptors();
</script>

<template>
    <UApp>
        <Header />

        <div class="container mx-auto flex flex-col grow">
            <RouterView />
        </div>
    </UApp>
</template>
