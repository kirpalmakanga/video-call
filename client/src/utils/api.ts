import axios from 'axios';
import type {
    LoginFormData,
    RegisterFormData,
    UpdateProfileFormData
} from './validation';

export async function register(credentials: RegisterFormData) {
    const { data } = await axios.post('/auth/register', credentials);

    return data as { accessToken: string; refreshToken: string };
}

export async function logIn(credentials: LoginFormData) {
    const { data } = await axios.post('/auth/login', credentials);

    return data as { accessToken: string; refreshToken: string };
}

export async function getCurrentUserProfile() {
    const { data } = await axios.get('/users/profile');

    return data as User;
}

export async function updateCurrentUserProfile(data: UpdateProfileFormData) {
    await axios.put('/users/profile', data);
}

export async function refreshAccessToken(refreshToken: string) {
    const { data } = await axios.post('/auth/refresh', { refreshToken });

    return data as { accessToken: string; refreshToken: string };
}

export async function getAllRooms() {
    const { data } = await axios.get('/rooms');

    return data as Room[];
}

export async function getRoomById(roomId: string) {
    const { data } = await axios.get(`/rooms/${roomId}`);

    return data as Room;
}

export async function createRoom(body: RoomFormData) {
    const { data } = await axios.post('/rooms', body);

    return data as Room;
}

export async function updateRoom(roomId: string, body: RoomFormData) {
    const { data } = await axios.put(`/rooms/${roomId}`, body);

    return data as Room;
}
