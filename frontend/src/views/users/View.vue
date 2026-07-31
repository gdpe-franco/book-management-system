<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Button from "primevue/button";
import Card from "primevue/card";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import InputText from "primevue/inputtext";
import { useAuthStore } from "../../stores/auth";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "superadmin";
  created_at: string;
};

type UserList = {
  data: User[];
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
const router = useRouter();
const loading = ref(true);
const error = ref("");
const users = ref<User[]>([]);
const pagination = ref<UserList["meta"]>({
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

async function expireSession(): Promise<void> {
  auth.clear();
  await router.push("/login");
}

async function loadUsers(page = 1): Promise<void> {
  if (auth.token === null) return;

  loading.value = true;
  error.value = "";

  const query = new URLSearchParams({
    page: String(page),
    per_page: String(perPage.value),
  });

  if (appliedSearch.value !== "") query.set("search", appliedSearch.value);
  if (sortField.value !== undefined && sortOrder.value !== 0) {
    query.set("sort_by", sortField.value);
    query.set("sort_direction", sortOrder.value === 1 ? "asc" : "desc");
  }

  try {
    const response = await fetch(`/api/v1/users?${query}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.status === 401) {
      await expireSession();

      return;
    }

    if (!response.ok) throw new Error("Unable to load users.");

    const body = (await response.json()) as UserList;
    users.value = body.data;
    pagination.value = body.meta;
  } catch {
    error.value = "Users could not be loaded. Please try again.";
  } finally {
    loading.value = false;
  }
}

function applySearch(): void {
  appliedSearch.value = search.value.trim();
  void loadUsers();
}

function clearSearch(): void {
  search.value = "";
  appliedSearch.value = "";
  void loadUsers();
}

function page(event: PageEvent): void {
  perPage.value = event.rows;
  void loadUsers(event.page + 1);
}

function sort(event: SortEvent): void {
  sortField.value =
    event.sortOrder === 0 || typeof event.sortField !== "string"
      ? undefined
      : event.sortField;
  sortOrder.value = event.sortOrder ?? 0;
  void loadUsers();
}

function createdAt(user: User): string {
  return new Date(user.created_at).toLocaleString();
}

onMounted(() => void loadUsers());
</script>

<template>
  <section class="books-page">
    <div class="books-heading">
      <div>
        <p class="card-kicker">Accounts</p>
        <h2>Users</h2>
      </div>
      <p>{{ pagination.total }} registered users</p>
    </div>

    <Card class="books-filters">
      <template #content>
        <form class="books-filter-form" @submit.prevent="applySearch">
          <label>
            Search name or email
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
      :sort-field="sortField"
      :sort-order="sortOrder"
      :total-records="pagination.total"
      :value="users"
      @page="page"
      @sort="sort"
    >
      <template #empty>No users match this search.</template>
      <Column field="name" header="Name" sortable />
      <Column field="email" header="Email" sortable />
      <Column field="role" header="Role" sortable />
      <Column field="created_at" header="Created" sortable>
        <template #body="{ data }">{{ createdAt(data) }}</template>
      </Column>
    </DataTable>
  </section>
</template>
