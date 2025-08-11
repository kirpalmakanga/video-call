<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../composables/store/use-auth-store';
import type { DropdownMenuItem } from '@nuxt/ui/runtime/components/DropdownMenu.vue.js';
import { computed } from 'vue';

const authStore = useAuthStore();
const { logOut } = authStore;
const { isLoggedIn, initials } = storeToRefs(authStore);

const menuItems = computed<DropdownMenuItem[]>(() => [
    {
        label: 'Settings',
        icon: 'i-mdi-settings',
        href: '/settings'
    },
    {
        type: 'separator'
    },
    {
        label: 'Log out',
        icon: 'i-mdi-logout',
        color: 'error',
        onSelect() {
            logOut();
        }
    }
]);
</script>

<template>
    <header class="bg-gray-900">
        <div
            class="container mx-auto flex items-center justify-between h-12 px-4"
        >
            <div class="font-bold">VCall</div>

            <UDropdownMenu
                v-if="isLoggedIn"
                :items="menuItems"
                :content="{ align: 'end', side: 'bottom' }"
            >
                <button>
                    <UAvatar :text="initials" />
                </button>
            </UDropdownMenu>
        </div>
    </header>
</template>
