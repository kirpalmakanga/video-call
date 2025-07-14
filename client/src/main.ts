import { createApp } from 'vue';
import ui from '@nuxt/ui/vue-plugin';
import App from './App.vue';
import router from './router';
import './assets/styles/main.css';
import './assets/styles/main.scss';

const app = createApp(App);

app.use(router);
app.use(ui);
app.mount('#app');
