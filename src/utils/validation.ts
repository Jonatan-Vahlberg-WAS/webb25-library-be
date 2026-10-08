import type { $ZodError } from "zod/v4/core";

export function getValidatorError (error: $ZodError) {
  return {
    errors: error.issues.map((issue) => {
      return [issue.path.join(", "), issue.message];
    }),
  };
};
