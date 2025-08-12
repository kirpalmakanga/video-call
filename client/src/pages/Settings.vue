<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import type { NavigationMenuItem } from '@nuxt/ui';
import { useRoute, useRouter } from 'vue-router';
import SettingsProfile from '../components/settings/SettingsProfile.vue';
import SettingsAccount from '../components/settings/SettingsAccount.vue';

const router = useRouter();
const route = useRoute();

const items = ref<NavigationMenuItem[][]>([
    [
        {
            label: 'Profile',
            icon: 'i-mdi-user-outline',
            to: '/settings/profile'
        },
        {
            label: 'Account',
            icon: 'i-mdi-settings-outline',
            to: '/settings/account'
        }
    ]
]);

const tab = computed(() => route.params.tab);

onBeforeMount(() => {
    if (!tab.value) {
        router.replace('/settings/profile');
    }
});
</script>

<template>
    <div class="flex grow items-start gap-4 p-4">
        <div class="bg-gray-900 p-4 rounded">
            <h1 class="font-bold mb-4">Settings</h1>

            <UNavigationMenu
                orientation="vertical"
                :items="items"
                class="data-[orientation=vertical]:w-48"
            />
        </div>

        <div class="flex flex-col grow bg-gray-900 p-4 rounded">
            <SettingsProfile v-if="tab === 'profile'" />

            <SettingsAccount v-else-if="tab === 'account'" />
        </div>
    </div>
</template>
