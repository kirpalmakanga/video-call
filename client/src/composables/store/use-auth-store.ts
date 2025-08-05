import { defineStore } from 'pinia';
import { computed, reactive, toRefs } from 'vue';
import {
    logIn,
    getCurrentUserProfile,
    refreshAccessToken,
    register
} from '../../utils/api';

interface State {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    accessToken: string;
    refreshToken: string;
}

const getDefaultState = (): State => ({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    accessToken: '',
    refreshToken: ''
});

export const useAuthStore = defineStore(
    'auth',
    () => {
        const state = reactive<State>(getDefaultState());

        async function fetchUserProfile() {
            const userData = await getCurrentUserProfile();

            Object.assign(state, userData);
        }

        return {
            ...toRefs(state),
            isLoggedIn: computed(() => !!state.accessToken),
            initials: computed(() => {
                const { firstName, lastName } = state;

                return `${firstName.at(0) || ''}${lastName.at(0) || ''}`;
            }),
            fullName: computed(() => {
                const { firstName, lastName } = state;

                return `${firstName} ${lastName}`;
            }),
            async refreshAccessToken() {
                const tokens = await refreshAccessToken(state.refreshToken);

                Object.assign(state, tokens);

                return tokens.accessToken;
            },
            async register(userData: RegisterFormData) {
                const tokens = await register(userData);

                Object.assign(state, tokens);

                await fetchUserProfile();
            },
            async logIn(credentials: LoginFormData) {
                const tokens = await logIn(credentials);

                Object.assign(state, tokens);

                await fetchUserProfile();
            },
            async logOut() {
                Object.assign(state, getDefaultState());
            }
        };
    },
    {
        persist: true
    }
);
