import { createApp } from 'vue';
// import ui from '@nuxt/ui/vue-plugin';
import App from './App.vue';
import router from './router';
import './assets/styles/main.css';
import './assets/styles/main.scss';

createApp(App).use(router).mount('#app');
