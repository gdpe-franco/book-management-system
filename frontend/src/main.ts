import { createApp } from "vue";
import { createPinia } from "pinia";
import "primeicons/primeicons.css";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import App from "./App.vue";
import router from "./router";
import theme from "./theme";
import { useThemeStore } from "./stores/theme";
import "./style.css";

const pinia = createPinia();

useThemeStore(pinia).initialize();

createApp(App)
  .use(pinia)
  .use(router)
  .use(PrimeVue, {
    theme: { preset: theme, options: { darkModeSelector: ".app-dark" } },
  })
  .use(ToastService)
  .directive("tooltip", Tooltip)
  .mount("#app");
