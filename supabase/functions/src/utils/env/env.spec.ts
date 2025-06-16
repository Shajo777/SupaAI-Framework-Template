import { assertEquals, assertThrows } from "@std/assert";
import { stub } from "@std/testing/mock";
import { Env, getEnv } from "@src/utils/env/env.utils.ts";

Deno.test("env.utils.ts", (_envC) => {
  Deno.test("getEnv function", async (t) => {
    await t.step(
      "returns the value of an existing environment variable",
      () => {
        const envSpy = stub(Deno.env, "get", () => "test-value");

        try {
          const value = getEnv("TEST_KEY");
          assertEquals(value, "test-value");
          assertEquals(envSpy.calls.length, 1);
          assertEquals(envSpy.calls[0].args[0], "TEST_KEY");
        } finally {
          envSpy.restore();
        }
      },
    );

    await t.step("handles empty string environment variable", () => {
      const envSpy = stub(Deno.env, "get", () => "");

      try {
        const value = getEnv("EMPTY_KEY");
        assertEquals(value, "");
        assertEquals(envSpy.calls.length, 1);
        assertEquals(envSpy.calls[0].args[0], "EMPTY_KEY");
      } finally {
        envSpy.restore();
      }
    });

    await t.step(
      "returns the default value when the environment variable doesn't exist",
      () => {
        const envSpy = stub(Deno.env, "get", () => undefined);

        try {
          const value = getEnv("NONEXISTENT_KEY", "default-value");
          assertEquals(value, "default-value");
          assertEquals(envSpy.calls.length, 1);
          assertEquals(envSpy.calls[0].args[0], "NONEXISTENT_KEY");
        } finally {
          envSpy.restore();
        }
      },
    );

    await t.step(
      "throws an error when the environment variable doesn't exist and no default value is provided",
      () => {
        const envSpy = stub(Deno.env, "get", () => undefined);

        try {
          assertThrows(
            () => getEnv("REQUIRED_KEY"),
            Error,
            'Required environment variable "REQUIRED_KEY" is missing',
          );
          assertEquals(envSpy.calls.length, 1);
          assertEquals(envSpy.calls[0].args[0], "REQUIRED_KEY");
        } finally {
          envSpy.restore();
        }
      },
    );

    await t.step("works with the Env enum as key", () => {
      const envSpy = stub(Deno.env, "get", () => "supabase-url-value");

      try {
        const value = getEnv(Env.supabaseUrl);
        assertEquals(value, "supabase-url-value");
        assertEquals(envSpy.calls.length, 1);
        assertEquals(envSpy.calls[0].args[0], "SUPABASE_URL");
      } finally {
        envSpy.restore();
      }
    });
  });
});
