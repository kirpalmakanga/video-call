import { createWebHistory, createRouter } from 'vue-router';

import Home from './pages/Home.vue';
import Room from './pages/Room.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/room/:roomId', component: Room }
    ]
});

export default router;
