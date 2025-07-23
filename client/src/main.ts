import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ui from '@nuxt/ui/vue-plugin';
import App from './App.vue';
import router from './router';
import './assets/styles/main.css';
import './assets/styles/main.scss';

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(ui);
app.use(pinia);
app.mount('#app');
