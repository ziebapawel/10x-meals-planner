/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

// Cloudflare runtime environment types
type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare global {
  namespace App {
    interface Locals extends Runtime {
      supabase: SupabaseClient<Database>;
      user: {
        id: string;
        email: string;
      } | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare runtime environment variables
interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OPENROUTER_API_KEY: string;
}
