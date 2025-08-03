import axios from 'axios';
import { useAuthStore } from './store/use-auth-store';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';

export default function useInterceptors() {
    const router = useRouter();
    const authStore = useAuthStore();
    const { refreshAccessToken, logOut } = authStore;
    const { accessToken } = storeToRefs(authStore);

    axios.defaults.baseURL = import.meta.env.VITE_API_URI;

    axios.interceptors.request.use((config) => {
        if (accessToken.value) {
            config.headers.Authorization = `Bearer ${accessToken.value}`;
        }

        return config;
    });

    // Add a response interceptor
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const {
                response: { status },
                config
            } = error;

            if (status === 401 && !config._retry) {
                await refreshAccessToken();

                config._retry = true;

                return axios(config);
            } else if (status === 401) {
                await logOut();

                router.push('/login');
            }

            return Promise.reject(error);
        }
    );
}
