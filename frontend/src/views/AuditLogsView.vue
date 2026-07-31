<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import { auditApiHost } from "../audit-service";
import { useAuthStore } from "../stores/auth";

type AuditLog = {
  event_id: string;
  event_type: string;
  actor_id: number;
  book_snapshot: { title?: unknown };
  occurred_at: string;
};

type AuditLogList = {
  data: AuditLog[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

type PageEvent = { page: number; rows: number };
type SortEvent = {
  sortField?: string | ((item: unknown) => string);
  sortOrder?: 1 | -1 | 0 | null;
};

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const loading = ref(true);
const error = ref("");
const auditLogs = ref<AuditLog[]>([]);
const pagination = ref<AuditLogList["meta"]>({
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
});
const perPage = ref(15);
const search = ref("");
const appliedSearch = ref("");
const sortField = ref<string>();
const sortOrder = ref<1 | -1 | 0>(0);
const highlightedEventId = computed(() =>
  typeof route.query.highlight === "string" ? route.query.highlight : undefined,
);

async function expireSession(): Promise<void> {
  auth.clear();
  await router.push("/login");
}

async function loadAuditLogs(page = 1): Promise<void> {
  if (auth.token === null) return;

  loading.value = true;
  error.value = "";

  const url = new URL("/api/v1/audit-logs", auditApiHost);
  url.search = new URLSearchParams({
    page: String(page),
    per_page: String(perPage.value),
  }).toString();

  if (appliedSearch.value !== "")
    url.searchParams.set("search", appliedSearch.value);
  if (sortField.value !== undefined && sortOrder.value !== 0) {
    url.searchParams.set("sort_by", sortField.value);
    url.searchParams.set(
      "sort_direction",
      sortOrder.value === 1 ? "asc" : "desc",
    );
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.status === 401) {
      await expireSession();

      return;
    }

    if (!response.ok) throw new Error("Unable to load audit logs.");

    const body = (await response.json()) as AuditLogList;
    auditLogs.value = body.data;
    pagination.value = body.meta;
  } catch {
    error.value = "Audit logs could not be loaded. Please try again.";
  } finally {
    loading.value = false;
  }
}

function applySearch(): void {
  appliedSearch.value = search.value.trim();
  void loadAuditLogs();
}

function clearSearch(): void {
  search.value = "";
  appliedSearch.value = "";
  void loadAuditLogs();
}

function page(event: PageEvent): void {
  perPage.value = event.rows;
  void loadAuditLogs(event.page + 1);
}

function sort(event: SortEvent): void {
  sortField.value =
    event.sortOrder === 0 || typeof event.sortField !== "string"
      ? undefined
      : event.sortField;
  sortOrder.value = event.sortOrder ?? 0;
  void loadAuditLogs();
}

function bookTitle(log: AuditLog): string {
  return typeof log.book_snapshot.title === "string"
    ? log.book_snapshot.title
    : "—";
}

function occurredAt(log: AuditLog): string {
  return new Date(log.occurred_at).toLocaleString();
}

function rowClass(log: AuditLog): string | undefined {
  return log.event_id === highlightedEventId.value
    ? "audit-log-highlight"
    : undefined;
}

onMounted(() => void loadAuditLogs());
</script>

<template>
  <section class="books-page">
    <div class="books-heading-actions">
      <p>{{ pagination.total }} audit logs</p>
    </div>

    <Card class="books-filters">
      <template #content>
        <form class="books-filter-form" @submit.prevent="applySearch">
          <label>
            Search event type, ID, or book title
            <InputText v-model="search" />
          </label>
          <div class="books-filter-actions">
            <Button label="Search" type="submit" />
            <Button
              label="Clear"
              severity="secondary"
              text
              type="button"
              @click="clearSearch"
            />
          </div>
        </form>
      </template>
    </Card>

    <p v-if="error" class="books-state books-state-error" role="alert">
      {{ error }}
    </p>
    <DataTable
      v-else
      :first="(pagination.current_page - 1) * pagination.per_page"
      class="books-table"
      lazy
      :loading="loading"
      paginator
      removable-sort
      :rows="perPage"
      :rows-per-page-options="[15, 30, 50]"
      :row-class="rowClass"
      :sort-field="sortField"
      :sort-order="sortOrder"
      :total-records="pagination.total"
      :value="auditLogs"
      @page="page"
      @sort="sort"
    >
      <template #empty>No audit logs match this search.</template>
      <Column field="event_type" header="Event type" sortable />
      <Column field="event_id" header="Event ID" sortable />
      <Column field="actor_id" header="Actor ID" sortable />
      <Column header="Book title">
        <template #body="{ data }">{{ bookTitle(data) }}</template>
      </Column>
      <Column field="occurred_at" header="Occurred" sortable>
        <template #body="{ data }">{{ occurredAt(data) }}</template>
      </Column>
    </DataTable>
  </section>
</template>
