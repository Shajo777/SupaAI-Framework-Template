import { assertEquals, assertExists } from "@std/assert";
import supabase from "@src/integrations/db/db.integration.ts";
import { loginTestUser } from "@src/integrations/db/db.fixtures.ts";

Deno.test("db.fixtures.ts - E2E Tests", async (t) => {
  await t.step("loginTestUser should login or create a test user", async () => {
    // Act
    const result = await loginTestUser();

    // Assert
    assertExists(result.user.id, "User ID should exist");
    assertExists(result.token, "Token should exist");
    assertEquals(result.user.email, "test@example.com");
    assertEquals(result.user.name, "Test User");
  });

  await t.step("loginTestUser should accept custom user data", async () => {
    // Arrange
    const customUser = {
      name: "Custom Test User",
      email: `test-${Date.now()}@example.com`, // Use timestamp to ensure unique email
      password: "customPassword123",
      lang: "de",
    };

    // Act
    const result = await loginTestUser(customUser);

    // Assert
    assertExists(result.user.id, "User ID should exist");
    assertExists(result.token, "Token should exist");
    assertEquals(result.user.email, customUser.email);
    assertEquals(result.user.name, customUser.name);
  });
});

Deno.test("db.integration.ts", async (t) => {
  await t.step("should connect to the database successfully", async () => {
    // Act
    const { data, error } = await supabase.from("blocks").select("id").limit(1);

    // Assert
    assertEquals(
      error,
      null,
      "Database connection error: " + (error?.message || "unknown error"),
    );
    assertExists(data, "No data returned from database");
  });
});
