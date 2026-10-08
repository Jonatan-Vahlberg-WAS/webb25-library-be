import { Hono } from "hono";
import type { PostgrestError } from "@supabase/supabase-js";

import {
  loanOptionalValidator,
  loanValidator,
} from "../validators/loanValidator.js";
import {
  createLoan,
  deleteLoan,
  getLoansByBookId,
  updateLoan,
} from "../database/loans.js";

const FOREIGN_KEY_VIOLATION = "23503";

const loans = new Hono({ strict: false });

// Lista alla loans för en Book
loans.get("/books/:bookId", async (c) => {
  const bookId = c.req.param("bookId");
  try {
    const loans = await getLoansByBookId(bookId);
    return c.json(loans);
  } catch (e) {
    console.warn("Error in fetching loans from SB database", e);
    return c.json([]);
  }
});

// Skapa en Loan för en Book, book_id tas från URL:en
loans.post("/books/:bookId", loanValidator, async (c) => {
  const bookId = c.req.param("bookId");
  const loanBody: LoanBody = c.req.valid("json");
  try {
    const loan = await createLoan(bookId, loanBody);
    return c.json(loan, 201);
  } catch (e) {
    console.warn("Error in inserting loan into SB DB", e);
    if ((e as PostgrestError).code === FOREIGN_KEY_VIOLATION) {
      return c.json(null, 404);
    }
    return c.json(e, 500);
  }
});

// Uppdatera en Loan om den finns och tillhör Booken
loans.patch(
  "/books/:bookId/:loanId",
  loanOptionalValidator,
  async (c) => {
    const bookId = c.req.param("bookId");
    const loanId = c.req.param("loanId");
    const loanBody: Partial<LoanBody> = c.req.valid("json");
    try {
      const loan = await updateLoan(bookId, loanId, loanBody);
      return c.json(loan);
    } catch (e) {
      console.warn("Error updating loan in SB DB", e);
      return c.json(null, 404);
    }
  },
);

// Ta bort en Loan om den finns och tillhör Booken
loans.delete("/books/:bookId/:loanId", async (c) => {
  const bookId = c.req.param("bookId");
  const loanId = c.req.param("loanId");
  try {
    await deleteLoan(bookId, loanId);
    return c.json(null, 200);
  } catch (e) {
    console.warn("Error in deleting loan", e);
    return c.json(null, 404);
  }
});

export default loans;
