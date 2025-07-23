import { createWebHistory, createRouter } from 'vue-router';

const Home = () => import('./pages/Home.vue');
const Setup = () => import('./pages/Setup.vue');
const Room = () => import('./pages/Room.vue');

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/room/:roomId/start', component: Setup },
        { path: '/room/:roomId', component: Room }
    ]
});

export default router;
