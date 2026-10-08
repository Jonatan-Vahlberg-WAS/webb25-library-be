import { createClient } from "@supabase/supabase-js";

import { env } from "../env.js";

export const sb = createClient(
    env.supabaseUrl,
    env.supabaseKey
)
