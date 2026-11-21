import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './app.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import { registerSW } from './registerServiceWorker';
import { usePwaStore } from './stores/pwa';

// Global Styles
import './assets/css/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(vuetify);

// Initialize PWA store & capture install prompts early
const pwaStore = usePwaStore();
pwaStore.init();

// Register PWA Service Worker
registerSW();

app.mount('#app');
