import { createWebHistory, createRouter } from 'vue-router';

const Home = () => import('./pages/Home.vue');
const Setup = () => import('./pages/Setup.vue');
const Room = () => import('./pages/Room.vue');
const Login = () => import('./pages/Login.vue');
const Register = () => import('./pages/Register.vue');

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home, name: 'home' },
        { path: '/room/:roomId/start', component: Setup, name: 'room-start' },
        { path: '/room/:roomId', component: Room, name: 'room' },
        { path: '/login', component: Login, name: 'login' },
        { path: '/register', component: Register, name: 'register' }
    ]
});

export default router;
