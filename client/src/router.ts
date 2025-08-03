import { createWebHistory, createRouter } from 'vue-router';

const Home = () => import('./pages/Home.vue');
const Setup = () => import('./pages/Setup.vue');
const Room = () => import('./pages/Room.vue');
const Login = () => import('./pages/Login.vue');
const Register = () => import('./pages/Register.vue');

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/room/:roomId/start', component: Setup },
        { path: '/room/:roomId', component: Room },
        { path: '/login', component: Login },
        { path: '/register', component: Register }
    ]
});

export default router;
