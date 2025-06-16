import { assertEquals } from "@std/assert";
import { z } from "zod";
import { validateRequestParams } from "@src/utils/validation/validation.utils.ts";

Deno.test("validation.utils.ts", (_validationC) => {
  Deno.test("validateRequestParams function", async (t) => {
    await t.step("returns success with valid data for a simple argsSchema", () => {
      // Define a simple argsSchema
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      // Valid data
      const validData = {
        name: "John Doe",
        age: 30,
      };

      // Validate
      const result = validateRequestParams(validData, schema);

      // Assert
      assertEquals(result.success, true);
      if (result.success) {
        assertEquals(result.data.name, "John Doe");
        assertEquals(result.data.age, 30);
      }
    });

    await t.step("returns error with invalid data for a simple argsSchema", () => {
      // Define a simple argsSchema
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      // Invalid data (age is a string instead of a number)
      const invalidData = {
        name: "John Doe",
        age: "thirty", // This should be a number
      };

      // Validate
      const result = validateRequestParams(invalidData, schema);

      // Assert
      assertEquals(result.success, false);
      if (!result.success) {
        // Check that the error contains information about the age field
        // Use type assertion to tell TypeScript that the error object has an 'age' property
        const error = result.error as z.ZodFormattedError<
          { name: string; age: number }
        >;
        assertEquals(typeof error.age, "object");
      }
    });

    await t.step("works with complex nested schemas", () => {
      // Define a complex nested argsSchema
      const addressSchema = z.object({
        street: z.string(),
        city: z.string(),
        zipCode: z.string(),
      });

      const userSchema = z.object({
        name: z.string(),
        email: z.string().email(),
        address: addressSchema,
        tags: z.array(z.string()),
      });

      // Valid data
      const validData = {
        name: "Jane Smith",
        email: "jane@example.com",
        address: {
          street: "123 Main St",
          city: "Anytown",
          zipCode: "12345",
        },
        tags: ["customer", "premium"],
      };

      // Validate
      const result = validateRequestParams(validData, userSchema);

      // Assert
      assertEquals(result.success, true);
      if (result.success) {
        assertEquals(result.data.name, "Jane Smith");
        assertEquals(result.data.email, "jane@example.com");
        assertEquals(result.data.address.street, "123 Main St");
        assertEquals(result.data.tags.length, 2);
      }
    });

    await t.step("handles optional fields correctly", () => {
      // Define a argsSchema with optional fields
      const schema = z.object({
        name: z.string(),
        age: z.number().optional(),
        email: z.string().email().optional(),
      });

      // Valid data with only required fields
      const validData = {
        name: "Alice",
      };

      // Validate
      const result = validateRequestParams(validData, schema);

      // Assert
      assertEquals(result.success, true);
      if (result.success) {
        assertEquals(result.data.name, "Alice");
        assertEquals(result.data.age, undefined);
        assertEquals(result.data.email, undefined);
      }
    });

    await t.step("demonstrates type inference with destructuring", () => {
      // Define a argsSchema
      const schema = z.object({
        id: z.string(),
        count: z.number(),
        isActive: z.boolean(),
      });

      // Valid data
      const validData = {
        id: "123",
        count: 5,
        isActive: true,
      };

      // Validate
      const result = validateRequestParams(validData, schema);

      // Demonstrate type inference with destructuring
      if (result.success) {
        // TypeScript should correctly infer these types
        const { id, count, isActive } = result.data;
        assertEquals(typeof id, "string");
        assertEquals(typeof count, "number");
        assertEquals(typeof isActive, "boolean");
      }
    });
  });
});
