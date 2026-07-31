<script setup lang="ts">
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import type { Book, BookList, PageEvent, SortEvent } from "./types";

defineProps<{
  books: Book[];
  loading: boolean;
  pagination: BookList["meta"];
  perPage: number;
  sortField?: string;
  sortOrder: 1 | -1 | 0;
}>();

const emit = defineEmits<{
  page: [event: PageEvent];
  sort: [event: SortEvent];
  view: [book: Book];
}>();
</script>

<template>
  <DataTable
    :first="(pagination.current_page - 1) * pagination.per_page"
    lazy
    :loading="loading"
    paginator
    removable-sort
    :rows="perPage"
    :rows-per-page-options="[15, 30, 50]"
    :sort-field="sortField"
    :sort-order="sortOrder"
    :total-records="pagination.total"
    :value="books"
    @page="emit('page', $event)"
    @sort="emit('sort', $event)"
  >
    <template #empty>No active books match this search.</template>
    <Column field="title" header="Title" sortable />
    <Column field="author" header="Author" sortable />
    <Column field="isbn" header="ISBN" sortable />
    <Column field="published_year" header="Published" sortable />
    <Column header="Actions">
      <template #body="{ data }">
        <Button
          label="View"
          severity="secondary"
          text
          @click="emit('view', data)"
        />
      </template>
    </Column>
  </DataTable>
</template>
