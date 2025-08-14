import axios from 'axios';
import type {
    LoginFormData,
    RegisterFormData,
    UpdateProfileFormData
} from './validation';

export const apiInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URI
});

export const authInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URI}/auth`
});

/** Auth */
export async function register(
    credentials: Omit<RegisterFormData, 'confirmPassword'>
) {
    const { data } = await authInstance.post('/register', credentials);

    return data as { accessToken: string; refreshToken: string };
}

export async function refreshAccessToken(refreshToken: string) {
    const { data } = await authInstance.post('/refresh', { refreshToken });

    return data as { accessToken: string; refreshToken: string };
}

export async function logIn(credentials: LoginFormData) {
    const { data } = await authInstance.post('/login', credentials);

    return data as { accessToken: string; refreshToken: string };
}

export async function updatePassword(password: string) {
    await authInstance.put('/password', { password });
}

export async function getCurrentUserProfile() {
    const { data } = await apiInstance.get('/users/profile');

    return data as User;
}

export async function sendVerificationEmail(email: string) {
    await authInstance.post('/verify/send', { email });
}

/** API */
export async function updateCurrentUserProfile(data: UpdateProfileFormData) {
    await apiInstance.put('/users/profile', data);
}

export async function getAllRooms() {
    const { data } = await apiInstance.get('/rooms');

    return data as Room[];
}

export async function getRoomById(roomId: string) {
    const { data } = await apiInstance.get(`/rooms/${roomId}`);

    return data as Room;
}

export async function createRoom(body: RoomFormData) {
    const { data } = await apiInstance.post('/rooms', body);

    return data as Room;
}

export async function updateRoom(roomId: string, body: RoomFormData) {
    const { data } = await apiInstance.put(`/rooms/${roomId}`, body);

    return data as Room;
}
