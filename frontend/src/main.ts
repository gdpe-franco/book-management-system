import { createApp } from "vue";
import { createPinia } from "pinia";
import "primeicons/primeicons.css";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import Tooltip from "primevue/tooltip";
import App from "./App.vue";
import router from "./router";
import theme from "./theme";
import "./style.css";

createApp(App)
  .use(createPinia())
  .use(router)
  .use(PrimeVue, {
    theme: { preset: theme, options: { darkModeSelector: "none" } },
  })
  .use(ToastService)
  .directive("tooltip", Tooltip)
  .mount("#app");
