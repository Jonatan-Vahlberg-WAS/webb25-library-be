# Add authentication

The library API does not check who is calling it yet. These steps add the same authentication base as the stay-finder backend: email register and login, a Supabase client that stores the session in cookies, and a check that blocks creating a book unless that session exists.

Reading books and loans stays open. Only `POST /books` becomes protected, in the same place stay-finder protected `POST /properties`.

`src/env.ts` already reads `SUPABASE_URL`, `SUPABASE_KEY`, `FRONTEND_URL`, and `NODE_ENV`. No change is needed there.

## 1. Turn on email login in Supabase

In the Supabase dashboard:

1. Open **Authentication → Sign In / Providers** and enable **Email**.
2. For local testing, disable **Confirm email**. Otherwise `POST /auth/login` fails until the inbox link is opened.
3. Copy the project URL and the **anon** key into `.env`.

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
FRONTEND_URL=http://localhost:3001
NODE_ENV=development
```

Use the anon key. The service role key ignores row level security, so it is the wrong key once login is in place.

## 2. Install the cookie client

The shared client in `src/lib/supabase.ts` stays as it is. Login needs a second client that can read and write cookies on each request.

```
npm install @supabase/ssr
```

## 3. Tell Hono about the user

Create `src/types/supabase.d.ts`.

```ts
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

export type BasicSupabaseClient = ReturnType<typeof createServerClient>;

declare module "hono" {
  interface ContextVariableMap {
    supabase: BasicSupabaseClient;
    user: User | null;
  }
}
```

After this, `c.get("supabase")` and `c.get("user")` are typed.

## 4. Validate email and password

`src/validators/authValidator.ts` is already in place. Register and login both use it. A short password or a bad email returns `400` with the same error shape as the book and loan validators.

The schema is:

```ts
import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";

const authSchema = z.object({
  email: z.email("A valid email is required"),
  password: z.string().min(6, "Password has to be 6 chars long"),
});

export const authValidator = zValidator("json", authSchema, (result, c) => {
  if (!result.success) {
    return c.json(getValidatorError(result.error), 400);
  }
});
```

## 5. Add the auth middleware

Create `src/middleware/auth.ts`.

```ts
import type { Context, Next } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { createServerClient } from "@supabase/ssr";

import { env } from "../env.js";
import type { BasicSupabaseClient } from "../types/supabase.js";

function createSupabaseForRequest(c: Context): BasicSupabaseClient {
  return createServerClient(env.supabaseUrl, env.supabaseKey, {
    cookies: {
      getAll() {
        const cookies = getCookie(c);

        return Object.entries(cookies).map(([name, value]) => ({
          name,
          value,
        }));
      },

      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          setCookie(c, name, value, {
            domain: options.domain,
            expires: options.expires,
            maxAge: options.maxAge,
            httpOnly: true,
            secure: env.nodeEnv === "production",
            sameSite: "lax",
            path: "/",
          });
        });
      },
    },
  });
}

async function setSupabaseContext(c: Context): Promise<void> {
  const existingClient = c.get("supabase") as BasicSupabaseClient | undefined;

  if (existingClient) {
    return;
  }

  const supabase = createSupabaseForRequest(c);

  c.set("supabase", supabase as any);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  c.set("user", error ? null : user);
}

export async function optionalAuth(c: Context, next: Next) {
  await setSupabaseContext(c);
  await next();
}

export async function requireAuth(c: Context, next: Next) {
  await setSupabaseContext(c);

  const user = c.get("user");

  if (!user) {
    throw new HTTPException(401, {
      message: "unauthorized",
    });
  }

  await next();
}
```

`optionalAuth` only loads the user. Missing cookies are fine, and `user` is `null`.

`requireAuth` does the same load, then stops the request with `401` when there is no user.

## 6. Replace the unimplemented auth calls

`src/routes/auth.ts` is already mounted at `/auth`. `signUp` and `signInWithPassword` still throw `"Not implemented"`. Fill those two functions in. Leave the route handlers as they are.

Use the request client from the middleware, not the shared client in `src/lib/supabase.ts`. Supabase writes the session cookies while the call runs.

The route handlers already have the Hono context. Step 5 stores the client on that context. [Hono's `c.set` / `c.get`](https://hono.dev/docs/api/context#set-get) is how you read it back. These functions do not receive the context yet, so you decide how it gets there.

`signUp`

- [ ] Read the Supabase client for this request. See [Hono context variables](https://hono.dev/docs/api/context#set-get).
- [ ] Create the user with email and password. The method is documented in [Supabase `signUp`](https://supabase.com/docs/reference/javascript/auth-signup).
- [ ] Throw when that call returns an error. The same page shows the `error` field on the result.
- [ ] Return the created user. Look for the user on the `data` object in that same reference.

`signInWithPassword`

- [ ] Read the Supabase client for this request. Same Hono context as above.
- [ ] Sign in with email and password. The method is documented in [Supabase `signInWithPassword`](https://supabase.com/docs/reference/javascript/auth-signinwithpassword).
- [ ] Throw when that call returns an error. Check the `error` field on the result.
- [ ] Return the signed-in user. The reference shows where the user sits on `data`.

## 7. Load the user on each request

`/auth` is already mounted in `src/index.ts`. Register and login need the request client from step 5, so `optionalAuth` has to run before those routes.

- [ ] Import `optionalAuth` from the middleware file. Other route modules in `src/index.ts` are imported the same way. See [Hono routing](https://hono.dev/docs/api/routing).
- [ ] Run that middleware for every path, and register it before `/auth` is handled. [Hono middleware](https://hono.dev/docs/guides/middleware) shows how `app.use` applies a function to matching paths.
- [ ] Leave the existing `/`, `/books`, `/loans`, and `/auth` routes in place.

## 8. Protect creating a book

Only `POST /books` should require a signed-in user. `GET`, `PATCH`, and `DELETE` stay open. Step 5 already turns a missing user into `401`, so the new work is where that middleware is attached.

- [ ] Import `requireAuth` from the same middleware module as step 7.
- [ ] Add it on the create-book route only, before `bookValidator`. A route can take a middleware function ahead of its handler. See [Hono middleware](https://hono.dev/docs/guides/middleware) and [routing handlers](https://hono.dev/docs/api/routing#routing).
- [ ] Leave the other book routes unchanged, so a request with no session stops in the middleware and never reaches `createBook`.

## 9. Try it

Start the API with `npm run dev`, then call it from Postman or Thunder Client with the cookie jar enabled.

Register:

```
POST http://localhost:3000/auth/register
Content-Type: application/json

{
  "email": "anna@example.com",
  "password": "secret1"
}
```

Login, and keep the `Set-Cookie` values:

```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "anna@example.com",
  "password": "secret1"
}
```

Creating a book without those cookies returns `401`. The same request with the cookies returns `201`.

```
POST http://localhost:3000/books
Content-Type: application/json

{
  "title": "New book",
  "author": "Some Author",
  "description": "A short description.",
  "published_year": 2020,
  "copies": 1,
  "genre": "fiction"
}
```

`GET /books` still works without logging in.
