<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import Button from "primevue/button";
import Card from "primevue/card";
import Dialog from "primevue/dialog";
import InputNumber from "primevue/inputnumber";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import { useToast } from "primevue/usetoast";
import BookTable from "./Table.vue";
import type { Book, BookList, PageEvent, SortEvent } from "./types";
import { useAuthStore } from "../../stores/auth";

type BookResponse = { data: Book };
type BookForm = Omit<Book, "id">;
type FieldErrors = Partial<Record<keyof BookForm, string[]>>;
type ErrorResponse = {
  errors?: FieldErrors;
};

const auth = useAuthStore();
const router = useRouter();
const toast = useToast();
const loading = ref(true);
const error = ref("");
const books = ref<Book[]>([]);
const pagination = ref<BookList["meta"]>({
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
const detailsVisible = ref(false);
const editing = ref(false);
const saving = ref(false);
const selectedBook = ref<Book>();
const fieldErrors = ref<FieldErrors>({});
const bookForm = reactive<BookForm>({
  title: "",
  author: "",
  isbn: "",
  published_year: new Date().getFullYear(),
});
const maximumPublishedYear = new Date().getFullYear();

async function expireSession(): Promise<void> {
  auth.clear();
  await router.push("/login");
}

async function loadBooks(page = 1): Promise<void> {
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
    const response = await fetch(`/api/v1/books?${query}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (response.status === 401) {
      await expireSession();

      return;
    }

    if (!response.ok) throw new Error("Unable to load books.");

    const body = (await response.json()) as BookList;
    books.value = body.data;
    pagination.value = body.meta;
  } catch {
    error.value = "Books could not be loaded. Please try again.";
  } finally {
    loading.value = false;
  }
}

function applySearch(): void {
  appliedSearch.value = search.value.trim();
  void loadBooks();
}

function clearSearch(): void {
  search.value = "";
  appliedSearch.value = "";
  void loadBooks();
}

function page(event: PageEvent): void {
  perPage.value = event.rows;
  void loadBooks(event.page + 1);
}

function sort(event: SortEvent): void {
  sortField.value =
    event.sortOrder === 0 || typeof event.sortField !== "string"
      ? undefined
      : event.sortField;
  sortOrder.value = event.sortOrder ?? 0;
  void loadBooks();
}

function openBook(book: Book): void {
  selectedBook.value = book;
  editing.value = false;
  detailsVisible.value = true;
}

function closeBook(): void {
  detailsVisible.value = false;
  editing.value = false;
  fieldErrors.value = {};
}

function startEditing(): void {
  if (selectedBook.value === undefined) return;

  Object.assign(bookForm, selectedBook.value);
  fieldErrors.value = {};
  editing.value = true;
}

function cancelEditing(): void {
  fieldErrors.value = {};
  editing.value = false;
}

async function saveBook(): Promise<void> {
  if (auth.token === null || selectedBook.value === undefined) return;

  saving.value = true;
  fieldErrors.value = {};

  try {
    const response = await fetch(`/api/v1/books/${selectedBook.value.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bookForm),
    });

    if (response.status === 401) {
      await expireSession();

      return;
    }

    const body = (await response.json()) as ErrorResponse & BookResponse;

    if (response.status === 422) {
      fieldErrors.value = body.errors ?? {};

      return;
    }

    if (!response.ok) throw new Error("Unable to update book.");

    selectedBook.value = body.data;
    books.value = books.value.map((book) =>
      book.id === body.data.id ? body.data : book,
    );
    toast.add({
      severity: "success",
      summary: "Book updated",
      detail: "The catalog was updated.",
      life: 3000,
    });
    closeBook();
  } catch {
    toast.add({
      severity: "error",
      summary: "Update failed",
      detail: "The book could not be updated. Please try again.",
      life: 5000,
    });
  } finally {
    saving.value = false;
  }
}

onMounted(() => void loadBooks());
</script>

<template>
  <section class="books-page">
    <div class="books-heading">
      <div>
        <p class="card-kicker">Catalog</p>
        <h2>Books</h2>
      </div>
      <p>{{ pagination.total }} active books</p>
    </div>

    <Card class="books-filters">
      <template #content>
        <form class="books-filter-form" @submit.prevent="applySearch">
          <label>
            Search title, author, or ISBN
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
    <BookTable
      v-else
      class="books-table"
      :books="books"
      :loading="loading"
      :pagination="pagination"
      :per-page="perPage"
      :sort-field="sortField"
      :sort-order="sortOrder"
      @page="page"
      @sort="sort"
      @view="openBook"
    />

    <Dialog
      v-model:visible="detailsVisible"
      :header="editing ? 'Edit book' : 'Book details'"
      modal
      :style="{ width: 'min(100vw - 2rem, 28rem)' }"
      @hide="closeBook"
    >
      <dl v-if="selectedBook !== undefined && !editing" class="book-details">
        <div>
          <dt>Title</dt>
          <dd>{{ selectedBook.title }}</dd>
        </div>
        <div>
          <dt>Author</dt>
          <dd>{{ selectedBook.author }}</dd>
        </div>
        <div>
          <dt>ISBN</dt>
          <dd>{{ selectedBook.isbn }}</dd>
        </div>
        <div>
          <dt>Published year</dt>
          <dd>{{ selectedBook.published_year }}</dd>
        </div>
      </dl>
      <form
        v-else
        id="book-form"
        class="book-modal-form"
        @submit.prevent="saveBook"
      >
        <label>
          Title
          <InputText v-model="bookForm.title" maxlength="255" required />
          <Message v-if="fieldErrors.title" severity="error" size="small">{{
            fieldErrors.title[0]
          }}</Message>
        </label>
        <label>
          Author
          <InputText v-model="bookForm.author" maxlength="255" required />
          <Message v-if="fieldErrors.author" severity="error" size="small">{{
            fieldErrors.author[0]
          }}</Message>
        </label>
        <label>
          ISBN
          <InputText
            v-model="bookForm.isbn"
            inputmode="numeric"
            maxlength="13"
            required
          />
          <Message v-if="fieldErrors.isbn" severity="error" size="small">{{
            fieldErrors.isbn[0]
          }}</Message>
        </label>
        <label>
          Published year
          <InputNumber
            v-model="bookForm.published_year"
            :max="maximumPublishedYear"
            :min="1450"
            required
            :use-grouping="false"
          />
          <Message
            v-if="fieldErrors.published_year"
            severity="error"
            size="small"
            >{{ fieldErrors.published_year[0] }}</Message
          >
        </label>
      </form>
      <template #footer>
        <template v-if="editing">
          <Button
            label="Cancel"
            severity="secondary"
            text
            @click="cancelEditing"
          />
          <Button
            form="book-form"
            label="Save changes"
            :loading="saving"
            type="submit"
          />
        </template>
        <template v-else>
          <Button label="Close" severity="secondary" text @click="closeBook" />
          <Button label="Edit" @click="startEditing" />
        </template>
      </template>
    </Dialog>
  </section>
</template>
