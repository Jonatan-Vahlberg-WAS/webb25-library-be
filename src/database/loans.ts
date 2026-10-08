import type { PostgrestSingleResponse } from "@supabase/supabase-js";

import { sb } from "../lib/supabase.js";

const TABLE_NAME = "loans";

const SELECT_QUERY_LIST: LoanValidKey[] = [
  "loan_id",
  "book_id",
  "borrower_name",
  "borrower_email",
  "loan_date",
  "due_date",
  "status",
  "created_at",
];

const SELECT_QUERY = SELECT_QUERY_LIST.join(", ");
const QUERY_ID = "loan_id";
const QUERY_BOOK_ID = "book_id";

export async function getLoansByBookId(
  bookId: string,
): Promise<Loan[]> {
  const { error, data } = await sb
    .from(TABLE_NAME)
    .select(SELECT_QUERY)
    .eq(QUERY_BOOK_ID, bookId)
    .order("loan_date");

  if (!error) {
    return data as any as Loan[];
  }
  throw error;
}

export async function createLoan(
  bookId: string,
  loanBody: LoanBody,
): Promise<Loan> {
  const newLoan: NewLoan = { ...loanBody, book_id: Number(bookId) };
  const { error, data }: PostgrestSingleResponse<Loan> = await sb
    .from(TABLE_NAME)
    .insert(newLoan)
    .select(SELECT_QUERY)
    .single();

  if (!error) {
    return data;
  }
  throw error;
}

export async function updateLoan(
  bookId: string,
  loanId: string,
  loan: Partial<LoanBody>,
): Promise<Loan> {
  const { error, data }: PostgrestSingleResponse<Loan> = await sb
    .from(TABLE_NAME)
    .update(loan)
    .eq(QUERY_ID, loanId)
    .eq(QUERY_BOOK_ID, bookId)
    .select(SELECT_QUERY)
    .single();

  if (!error) {
    return data;
  }
  throw error;
}

export async function deleteLoan(bookId: string, loanId: string) {
  const { error }: PostgrestSingleResponse<Loan> = await sb
    .from(TABLE_NAME)
    .delete()
    .eq(QUERY_ID, loanId)
    .eq(QUERY_BOOK_ID, bookId)
    .select()
    .single();

  if (!error) {
    return;
  }
  throw error;
}
