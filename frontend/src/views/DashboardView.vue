<script setup lang="ts">
import Card from "primevue/card";
import { useAuthStore } from "../stores/auth";

type Cover = { title: string; isbn: string };

const auth = useAuthStore();
const covers: Cover[] = [
  { title: "The Odyssey", isbn: "9780140268867" },
  {
    title: "Pride and Prejudice",
    isbn: "9780141439518",
  },
  { title: "Sapiens", isbn: "9780062316097" },
  { title: "Perfume", isbn: "9780375725845" },
  {
    title: "One Hundred Years of Solitude",
    isbn: "9780060883287",
  },
  { title: "Dune", isbn: "9780441172719" },
  { title: "Little Women", isbn: "9780147514011" },
  {
    title: "The Murders in the Rue Morgue",
    isbn: "9780679643425",
  },
  {
    title: "The Second Sex",
    isbn: "9780307265562",
  },
  {
    title: "Man's Search for Meaning",
    isbn: "9780807014295",
  },
];
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

    <section aria-label="Book covers" class="book-carousel">
      <div class="book-carousel-heading">
        <p class="card-kicker">Catalogue highlights</p>
        <span>{{ covers.length }} selected titles</span>
      </div>
      <ul>
        <li v-for="book in covers" :key="book.title" class="book-cover">
          <img
            :alt="`${book.title} cover`"
            :src="`https://covers.openlibrary.org/b/isbn/${book.isbn}-M.jpg`"
          />
          <span>{{ book.title }}</span>
        </li>
      </ul>
      <a href="https://openlibrary.org" rel="noreferrer" target="_blank"
        >Cover images: Open Library</a
      >
    </section>
  </section>
</template>
