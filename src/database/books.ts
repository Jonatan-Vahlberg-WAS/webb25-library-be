import type {
  PostgrestFilterBuilder,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

import { sb } from "../lib/supabase.js";

const TABLE_NAME = "books";

const SELECT_QUERY_LIST: BookValidKey[] = [
  "book_id",
  "title",
  "author",
  "description",
  "published_year",
  "copies",
  "genre",
  "created_at",
];

const SELECT_QUERY = SELECT_QUERY_LIST.join(", ");
const QUERY_ID = "book_id";
const QUERY_GENRE = "genre";

type BookListFilter = Partial<{
  maxYear: number;
  author: string;
  copies: number;
}>;

function buildBooksFilter(
  query: PostgrestFilterBuilder<any, any, any, any>,
  filters: BookListFilter,
) {
  if (filters.maxYear) {
    query = query.lte("published_year", filters.maxYear);
  }

  if (filters.copies) {
    query = query.gte("copies", filters.copies);
  }

  if (filters.author && filters.author.trim().length > 2) {
    query = query.ilike("author", `%${filters.author}%`);
  }
}

export async function getBooks(
  filters: BookListFilter,
): Promise<Book[]> {
  let query = sb.from(TABLE_NAME).select(SELECT_QUERY);

  buildBooksFilter(query, filters);

  const { error, data } = await query;

  if (!error) {
    return data as any as Book[];
  }
  throw error;
}

export async function getBooksByGenre(
  genre: BookGenre,
  filters: BookListFilter,
): Promise<Book[]> {
  const query = sb.from(TABLE_NAME).select(SELECT_QUERY).eq(QUERY_GENRE, genre);

  buildBooksFilter(query, filters);

  const { error, data } = await query;

  if (!error) {
    return data as any as Book[];
  }
  throw error;
}

export async function getBookById(bookId: string): Promise<Book> {
  const { error, data }: PostgrestSingleResponse<Book> = await sb
    .from(TABLE_NAME)
    .select(SELECT_QUERY)
    .eq(QUERY_ID, bookId)
    .single();

  if (!error) {
    return data;
  }
  throw error;
}

export async function createBook(bookBody: NewBook) {
  const { error, data }: PostgrestSingleResponse<Book> = await sb
    .from(TABLE_NAME)
    .insert(bookBody)
    .select(SELECT_QUERY)
    .single();

  if (!error) {
    return data;
  }
  throw error;
}

export async function updateBookById(
  bookId: string,
  book: Partial<Book>,
): Promise<Book> {
  const { error, data }: PostgrestSingleResponse<Book> = await sb
    .from(TABLE_NAME)
    .update(book)
    .eq(QUERY_ID, bookId)
    .select()
    .single();

  if (!error) {
    return data;
  }
  throw error;
}

export async function deleteBookById(bookId: string) {
  const { error }: PostgrestSingleResponse<Book> = await sb
    .from(TABLE_NAME)
    .delete()
    .eq(QUERY_ID, bookId)
    .select()
    .single();

  if (!error) {
    return;
  }
  throw error;
}
