import { createWebHistory, createRouter } from 'vue-router';

const Home = () => import('./pages/Home.vue');
const RoomSetup = () => import('./pages/RoomSetup.vue');
const Room = () => import('./pages/Room.vue');
const Login = () => import('./pages/Login.vue');
const Register = () => import('./pages/Register.vue');
const Settings = () => import('./pages/Settings.vue');

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home, name: 'home' },
        {
            path: '/room/:roomId/setup',
            component: RoomSetup,
            name: 'room-setup'
        },
        { path: '/room/:roomId', component: Room, name: 'room' },
        { path: '/login', component: Login, name: 'login' },
        { path: '/register', component: Register, name: 'register' },
        { path: '/settings/:tab?', component: Settings, name: 'settings' }
    ]
});

export default router;
