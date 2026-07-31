import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import theme from './theme'
import './style.css'

createApp(App)
  .use(createPinia())
  .use(router)
  .use(PrimeVue, { theme: { preset: theme, options: { darkModeSelector: 'none' } } })
  .mount('#app')
