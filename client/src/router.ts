import { createWebHistory, createRouter } from 'vue-router';
const Rooms = () => import('./pages/Rooms.vue');
const RoomSetup = () => import('./pages/RoomSetup.vue');
const Room = () => import('./pages/Room.vue');
const Login = () => import('./pages/Login.vue');
const ForgotPassword = () => import('./pages/ForgotPassword.vue');
const ResetPassword = () => import('./pages/ResetPassword.vue');
const Register = () => import('./pages/Register.vue');
const RegisterSuccess = () => import('./pages/RegisterSuccess.vue');
const RegisterVerified = () => import('./pages/RegisterVerified.vue');
const Settings = () => import('./pages/Settings.vue');

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', redirect: '/rooms' },
        { path: '/rooms/:tab?', component: Rooms, name: 'rooms' },
        {
            path: '/room/:roomId/setup',
            component: RoomSetup,
            name: 'room-setup'
        },
        { path: '/room/:roomId', component: Room, name: 'room' },
        { path: '/settings/:tab?', component: Settings, name: 'settings' },
        { path: '/login', component: Login, name: 'auth-login' },
        {
            path: '/forgot-password',
            component: ForgotPassword,
            name: 'auth-forgot-password'
        },
        {
            path: '/reset-password',
            component: ResetPassword,
            name: 'auth-reset-password'
        },
        { path: '/register', component: Register, name: 'auth-register' },
        {
            path: '/register/success',
            component: RegisterSuccess,
            name: 'auth-register-success'
        },
        {
            path: '/register/verified',
            component: RegisterVerified,
            name: 'auth-register-verified'
        }
    ]
});

export default router;
