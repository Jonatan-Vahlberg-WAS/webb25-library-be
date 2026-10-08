interface Loan {
  loan_id: number;
  book_id: number;
  borrower_name: string;
  borrower_email: string;
  loan_date: string;
  due_date: string;
  status: "active" | "returned" | "overdue";
  created_at: string;
}

type NewLoan = Omit<Loan, "loan_id" | "created_at">

type LoanBody = Omit<NewLoan, "book_id">

type LoanValidKey = keyof Loan
