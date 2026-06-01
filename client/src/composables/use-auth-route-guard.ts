import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from './store/use-auth-store';

export function useAuthRouteGuard() {
    const authStore = useAuthStore();
    const { isLoggedIn } = storeToRefs(authStore);

    const router = useRouter();

    router.beforeEach((to) => {
        if (!isLoggedIn.value && !!to.meta.authenticated) {
            return { name: 'auth-login' };
        }
    });

    watch(isLoggedIn, async () => {
        if (isLoggedIn.value) {
            await router.replace('/');
        } else {
            await router.replace('/login');
        }
    });
}
