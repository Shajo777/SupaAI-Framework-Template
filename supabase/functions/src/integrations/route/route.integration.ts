import { Hono } from "hono";
import { authMiddleware } from "@src/middleware/auth/auth.middleware.ts";

export default (functionName?: string) => {
  const app = new Hono();

  // Apply auth middleware to all routes
  app.use("*", authMiddleware);

  if (!functionName) {
    return app;
  }

  return app.basePath(`/${functionName}`);
};
