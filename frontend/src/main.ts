import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
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
  .mount("#app");
