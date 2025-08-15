import { watch } from 'vue';
import { useRouter, type RouteRecordNameGeneric } from 'vue-router';
import { useAuthStore } from './store/use-auth-store';
import { storeToRefs } from 'pinia';

export function useAuthRouteGuard() {
    const authStore = useAuthStore();
    const { isLoggedIn } = storeToRefs(authStore);
    const router = useRouter();

    function isAuthRoute(name: RouteRecordNameGeneric) {
        return name?.toString().startsWith('auth');
    }

    router.beforeEach(({ name }, _, next) => {
        if (!isLoggedIn.value && !isAuthRoute(name)) {
            next({ name: 'auth-login' });
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
}
