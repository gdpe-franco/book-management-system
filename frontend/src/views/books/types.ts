export type Book = {
  id: number;
  title: string;
  author: string;
  isbn: string;
  published_year: number;
};

export type BookList = {
  data: Book[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type BookForm = Omit<Book, "id">;
export type FieldErrors = Partial<Record<keyof BookForm, string[]>>;
export type ErrorResponse = { errors?: FieldErrors };

export type PageEvent = { page: number; rows: number };
export type SortEvent = {
  sortField?: string | ((item: unknown) => string);
  sortOrder?: 1 | -1 | 0 | null;
};
