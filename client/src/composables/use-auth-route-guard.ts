import { watch } from 'vue';
import { useRouter, type RouteLocationNormalizedGeneric } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from './store/use-auth-store';
import { useSocketInstance } from './use-socket';

export function useAuthRouteGuard() {
    const authStore = useAuthStore();
    const { isLoggedIn } = storeToRefs(authStore);
    const { removeSocket } = useSocketInstance();

    const router = useRouter();

    router.beforeEach((to, _, next) => {
        if (!isLoggedIn.value && !!to.meta.authenticated) {
            next({ name: 'auth-login' });
        } else {
            next();
        }
    });

    watch(isLoggedIn, () => {
        if (isLoggedIn.value) {
            router.replace('/');
        } else {
            router.replace('/login');

            removeSocket();
        }
    });
}
