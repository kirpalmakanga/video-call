import axios from 'axios';

export async function register(credentials: RegisterFormData) {
    const { data } = await axios.post('/auth/register', credentials);

    return data as { accessToken: string; refreshToken: string };
}

export async function logIn(credentials: LoginFormData) {
    const { data } = await axios.post('/auth/login', credentials);

    return data as { accessToken: string; refreshToken: string };
}

export async function getCurrentUserProfile() {
    const { data } = await axios.get('/auth/profile');

    return data as User;
}

export async function refreshAccessToken(refreshToken: string) {
    const { data } = await axios.post('/auth/refresh', { refreshToken });

    return data as { accessToken: string; refreshToken: string };
}
