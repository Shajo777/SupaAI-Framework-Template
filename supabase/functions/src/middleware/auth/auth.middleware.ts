import { Context, Next } from "hono";
import { createClient } from "@supabase/supabase-js";
import { Env, getEnv } from "@src/utils/env/env.utils.ts";
import { User } from "@supabase/supabase-js";

export const authMiddleware = async (
  c: Context,
  next: Next,
): Promise<Response | undefined> => {
  // Get the Authorization header
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Create Supabase client
    const supabaseUrl = getEnv(Env.supabaseUrl);
    const supabaseKey = getEnv(Env.supabaseServiceRoleKey);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the JWT token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ error: "Invalid token" }, { status: 401 });
    }

    // Add the user to the context for use in route handlers
    c.set("user", user as User);

    // Continue to the route handler
    await next();
  } catch (error) {
    return c.json({
      error: "Authentication failed",
      details: (error as Error).message,
    }, { status: 401 });
  }
};
