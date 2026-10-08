import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";

const bookSchema = z.object({
  title: z.string().min(2, "Title is necessary"),
  author: z.string().min(2, "Author is necessary"),
  description: z.string().min(3, "Description is necessary"),
  published_year: z
    .number()
    .min(1, "Published year needs to be at least 1"),
  copies: z.number().min(1, "Copies needs to be at least 1"),
  genre: z.enum<BookGenre[]>(
    ["fiction", "nonfiction"],
    `Must be one of "fiction", "nonfiction"`,
  ),
  book_id: z.number().optional(),
  created_at: z.string().optional(),
});

const bookOptionalSchema = bookSchema.partial();

const bookParamSchema = z.object({
  genre: z.enum<BookGenre[]>(
    ["fiction", "nonfiction"],
    `Param must be one of "fiction", "nonfiction"`,
  ),
});

export const bookValidator = zValidator(
  "json",
  bookSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);

export const bookOptionalValidator = zValidator(
  "json",
  bookOptionalSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);

export const bookParamValidator = zValidator(
  "param",
  bookParamSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);
