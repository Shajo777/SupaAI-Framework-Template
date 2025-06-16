export enum Env {
  port = "PORT",
  supabaseUrl = "SUPABASE_URL",
  supabaseServiceRoleKey = "SUPABASE_SERVICE_ROLE_KEY",
  supabaseAnonKey = "SUPABASE_ANON_KEY",
  openaiApiKey = "OPENAI_API_KEY",
  anthropicApiKey = "ANTHROPIC_API_KEY",
  googleApiKey = "GOOGLE_API_KEY",
}

export function getEnv(key: Env | string, defaultValue: string = ""): string {
  const value = Deno.env.get(String(key));
  if (value === undefined && !defaultValue) {
    throw new Error(`Required environment variable "${key}" is missing`);
  }
  return value ?? defaultValue;
}
