import { defineStore } from 'pinia';
import { computed, reactive, toRefs } from 'vue';
import {
    logIn,
    getCurrentUserProfile,
    refreshAccessToken,
    updateCurrentUserProfile
} from '../../services/api';
import type {
    LoginFormData,
    UpdateProfileFormData
} from '../../utils/validation';

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
            async updateUserProfile(data: UpdateProfileFormData) {
                await updateCurrentUserProfile(data);

                Object.assign(state, data);
            },
            async refreshAccessToken() {
                const tokens = await refreshAccessToken(state.refreshToken);

                Object.assign(state, tokens);
            },
            async logIn(credentials: LoginFormData) {
                const tokens = await logIn(credentials);

                Object.assign(state, tokens);

                const user = await getCurrentUserProfile();

                Object.assign(state, user);
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
