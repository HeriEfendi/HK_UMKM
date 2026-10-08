import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue';
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import { defineCustomElements } from '@ionic/pwa-elements/loader';

import App from './App.vue'
import router from './router'
import store from './store'
import { seedDatabase } from './db/schema'
import NumberInput from './components/NumberInput.vue'
import { VChart } from './plugins/echarts'




// Styles
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './style.css'

// Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

async function initializeApp() {
  try {
    await seedDatabase();
    const { UsersRepository } = await import('./db/usersRepository');
    await UsersRepository.seed();
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
  const app = createApp(App, {
    compilerOptions: {
      isCustomElement: (tag) => tag.startsWith('ion-')
    }
  });

  app.use(IonicVue);
  app.use(store);
  app.use(router);
  app.component('NumberInput', NumberInput);
  app.component('v-chart', VChart);
  app.component('VChart', VChart);

  const vm = app.mount('#app');
  // expose app for header toggle interop
  window.__app__ = vm;
  defineCustomElements(window);
}

initializeApp();

