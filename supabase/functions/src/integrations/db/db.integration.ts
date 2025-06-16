import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@src/utils/env/env.utils.ts";
import { Env } from "@src/utils/env/env.utils.ts";
import { Database } from "@src/integrations/db/db.types.ts";

/**
 * Database service wrapper around Supabase.
 */

// Client mit Typdefinitionen erstellen
const url = getEnv(Env.supabaseUrl);
const apiKey = getEnv(Env.supabaseServiceRoleKey);

// Ensure both URL and API key are available
if (!url) {
  throw new Error(
    "Supabase URL is required. Make sure SUPABASE_URL environment variable is set.",
  );
}

if (!apiKey) {
  throw new Error(
    "Supabase API key is required. Make sure SUPABASE_SERVICE_ROLE_KEY environment variable is set.",
  );
}

// Export a singleton instance of the database service
const supabase = createClient<Database>(url, apiKey);
export default supabase;
