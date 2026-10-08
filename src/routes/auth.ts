import { Hono } from "hono";
import { authValidator } from "../validators/authValidator.js";

const auth = new Hono({
  strict: false,
});

async function signUp(email: string, password: string) {
  throw new Error("Not implemented");
}

async function signInWithPassword(email: string, password: string) {
  throw new Error("Not implemented");
}

auth.post("/register", authValidator, async (c) => {
  const { email, password } = c.req.valid("json");

  try {
    const data = await signUp(email, password);
    return c.json(
      {
        user: data,
      },
      201,
    );
  } catch (e: any) {
    console.warn("Error in registering", e);
    return c.json(
      {
        message: e?.message,
      },
      400,
    );
  }
});

auth.post("/login", authValidator, async (c) => {
  const { email, password } = c.req.valid("json");

  try {
    const data = await signInWithPassword(email, password);
    return c.json({
      user: data,
    });
  } catch (e: any) {
    console.warn("Error in registering", e);
    return c.json(
      {
        message: e?.message,
      },
      400,
    );
  }
});

export default auth;
