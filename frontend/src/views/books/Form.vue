<script setup lang="ts">
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import type { BookForm, FieldErrors } from "./types";

defineProps<{ errors: FieldErrors }>();

const form = defineModel<BookForm>({ required: true });

const maximumPublishedYear = new Date().getFullYear();
</script>

<template>
  <label>
    Title
    <InputText v-model="form.title" maxlength="255" required />
    <Message v-if="errors.title" severity="error" size="small">{{
      errors.title[0]
    }}</Message>
  </label>
  <label>
    Author
    <InputText v-model="form.author" maxlength="255" required />
    <Message v-if="errors.author" severity="error" size="small">{{
      errors.author[0]
    }}</Message>
  </label>
  <label>
    ISBN
    <InputText
      v-model="form.isbn"
      inputmode="numeric"
      maxlength="13"
      required
    />
    <Message v-if="errors.isbn" severity="error" size="small">{{
      errors.isbn[0]
    }}</Message>
  </label>
  <label>
    Published year
    <InputNumber
      v-model="form.published_year"
      :max="maximumPublishedYear"
      :min="1450"
      required
      :use-grouping="false"
    />
    <Message v-if="errors.published_year" severity="error" size="small">{{
      errors.published_year[0]
    }}</Message>
  </label>
</template>
