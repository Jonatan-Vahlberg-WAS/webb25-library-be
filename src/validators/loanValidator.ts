import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";

const loanObject = z.object({
  borrower_name: z.string().min(2, "Borrower name is necessary"),
  borrower_email: z.email("Borrower email is not valid"),
  loan_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Loan date is not valid YYYY-MM-DD"),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Due date is not valid YYYY-MM-DD"),
  status: z.enum(["active", "returned", "overdue"]),
});

const dateOrder = {
  message: "Loan date can't be later than due date",
  path: ["loan_date"],
};

const loanSchema = loanObject.refine(
  (data) => data.loan_date <= data.due_date,
  dateOrder,
);

const loanOptionalSchema = loanObject
  .partial()
  .refine(
    (data) =>
      !data.loan_date || !data.due_date || data.loan_date <= data.due_date,
    dateOrder,
  );

export const loanValidator = zValidator(
  "json",
  loanSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);

export const loanOptionalValidator = zValidator(
  "json",
  loanOptionalSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);
