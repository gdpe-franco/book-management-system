<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import Button from "primevue/button";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Password from "primevue/password";
import { useAuthStore } from "../stores/auth";

type Mode = "login" | "register";

type ErrorResponse = {
  message?: string;
  errors?: Record<string, string[]>;
};

type TokenResponse = { token: string };

const props = defineProps<{ mode: Mode }>();
const auth = useAuthStore();
const router = useRouter();
const submitting = ref(false);
const errors = ref<string[]>([]);
const form = reactive({
  name: "",
  email: "",
  password: "",
  passwordConfirmation: "",
});
const isRegistration = computed(() => props.mode === "register");
const title = computed(() =>
  isRegistration.value ? "Create an account" : "Welcome back",
);

async function submit(): Promise<void> {
  submitting.value = true;
  errors.value = [];

  try {
    const response = await fetch(`/api/v1/auth/${props.mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isRegistration.value
          ? {
              name: form.name,
              email: form.email,
              password: form.password,
              password_confirmation: form.passwordConfirmation,
            }
          : { email: form.email, password: form.password },
      ),
    });
    const body = (await response.json()) as ErrorResponse & TokenResponse;

    if (!response.ok) {
      errors.value =
        response.status === 422 && body.errors
          ? Object.values(body.errors).flat()
          : [body.message ?? "Unable to sign in."];

      return;
    }

    if (!(await auth.establish(body.token))) {
      errors.value = ["Your session could not be started. Please try again."];

      return;
    }

    await router.push("/");
  } catch {
    errors.value = ["The service is unavailable. Please try again."];
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <main class="auth-page">
    <Card class="auth-card">
      <template #title>{{ title }}</template>
      <template #subtitle>Book Management System</template>
      <template #content>
        <form class="auth-form" @submit.prevent="submit">
          <Message v-for="error in errors" :key="error" severity="error">{{
            error
          }}</Message>

          <label v-if="isRegistration" for="name">Name</label>
          <InputText
            v-if="isRegistration"
            id="name"
            v-model="form.name"
            autocomplete="name"
            required
          />

          <label for="email">Email</label>
          <InputText
            id="email"
            v-model="form.email"
            autocomplete="email"
            type="email"
            required
          />

          <label for="password">Password</label>
          <Password
            v-model="form.password"
            input-id="password"
            :feedback="false"
            autocomplete="current-password"
            :minlength="8"
            required
            toggle-mask
          />

          <template v-if="isRegistration">
            <label for="password-confirmation">Confirm password</label>
            <Password
              v-model="form.passwordConfirmation"
              input-id="password-confirmation"
              :feedback="false"
              autocomplete="new-password"
              :minlength="8"
              required
              toggle-mask
            />
          </template>

          <Button
            :label="isRegistration ? 'Create account' : 'Log in'"
            :loading="submitting"
            type="submit"
          />
        </form>
      </template>
      <template #footer>
        <RouterLink :to="isRegistration ? '/login' : '/register'">
          {{
            isRegistration
              ? "Already have an account? Log in"
              : "Need an account? Register"
          }}
        </RouterLink>
      </template>
    </Card>
  </main>
</template>
