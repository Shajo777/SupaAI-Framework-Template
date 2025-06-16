import { assertEquals, assertExists } from "@std/assert";
import routeService from "@src/integrations/route/route.integration.ts";

Deno.test("route.integration.ts", (_routeC) => {
  Deno.test("routeService function", async (t) => {
    await t.step("returns a Hono instance with the correct base path", () => {
      // Arrange
      const functionName = "test-function";

      // Act
      const app = routeService(functionName);

      // Assert
      assertExists(app);
      // Check that it's a Hono instance by verifying it has typical Hono methods
      assertExists(app.get);
      assertExists(app.post);
      assertExists(app.put);
      assertExists(app.delete);

      // Check that the base path is set correctly
      // We can't directly access the base path, but we can check the app's internal state
      // by examining the string representation which should include the base path
      const appString = app.toString();
      assertEquals(
        appString.includes(`/${functionName}`),
        true,
        `App should have base path '/${functionName}', but got: ${appString}`,
      );
    });

    await t.step("handles empty function name", () => {
      // Arrange
      const functionName = "";

      // Act
      const app = routeService(functionName);

      // Assert
      assertExists(app);
      // Check that the base path is set correctly with empty function name
      const appString = app.toString();
      assertEquals(
        appString.includes(`/`),
        true,
        `App should have base path '/', but got: ${appString}`,
      );
    });

    await t.step("handles special characters in function name", () => {
      // Arrange
      const functionName = "special-chars_123";

      // Act
      const app = routeService(functionName);

      // Assert
      assertExists(app);
      // Check that the base path is set correctly with special characters
      const appString = app.toString();
      assertEquals(
        appString.includes(`/${functionName}`),
        true,
        `App should have base path '/${functionName}', but got: ${appString}`,
      );
    });
  });
});
