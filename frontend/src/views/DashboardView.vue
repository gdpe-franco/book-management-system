<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Card from "primevue/card";
import { useAuthStore } from "../stores/auth";

type Book = { title: string; author: string };

const auth = useAuthStore();
const router = useRouter();
const covers = ref<Book[]>([]);

async function loadCovers(): Promise<void> {
  if (auth.token === null) return;

  try {
    const response = await fetch("/api/v1/books?per_page=10", {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.status === 401) {
      auth.clear();
      await router.push("/login");

      return;
    }

    if (!response.ok) return;

    covers.value = ((await response.json()) as { data: Book[] }).data;
  } catch {
    // The dashboard remains useful when the catalogue is unavailable.
  }
}

onMounted(() => void loadCovers());
</script>

<template>
  <section class="dashboard-page">
    <Card class="content-card">
      <template #title>Welcome back, {{ auth.user?.name }}</template>
      <template #content>
        <p>
          You are signed in as <strong>{{ auth.user?.role }}</strong
          >. Choose an area from the menu to continue.
        </p>
      </template>
    </Card>

    <section
      v-if="covers.length > 0"
      aria-label="Book covers"
      class="book-carousel"
    >
      <div class="book-carousel-heading">
        <p class="card-kicker">Catalogue highlights</p>
        <span>{{ covers.length }} current titles</span>
      </div>
      <ul>
        <li v-for="book in covers" :key="book.title" class="book-cover">
          <span>{{ book.title }}</span>
          <small>{{ book.author }}</small>
        </li>
      </ul>
    </section>
  </section>
</template>
