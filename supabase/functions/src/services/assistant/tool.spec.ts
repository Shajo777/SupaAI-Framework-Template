import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { stub } from "@std/testing/mock";
import { z } from "zod";
import {
  AssistantTool,
  AssistantToolType,
  OpenAIToolType,
} from "@src/services/assistant/tool.utils.ts";
import { AppErrorCode, handleAppError } from "@src/utils/error/error.utils.ts";

Deno.test("tool.utils.ts", (_toolC) => {
  Deno.test("AssistantTool class", async (t) => {
    // Define test schema and function for reuse
    const testSchema = z.object({
      id: z.string(),
      value: z.number().optional(),
    });

    // Define with the correct generic signature
    const testFunction = <T>(args: unknown): Promise<T> => {
      const typedArgs = args as Record<string, unknown>;
      return Promise.resolve({
        success: true,
        id: typeof typedArgs.id === "string" ? typedArgs.id : "",
        value: typeof typedArgs.value === "number" ? typedArgs.value : undefined,
      } as unknown as T);
    };

    await t.step("constructor initializes properties correctly", () => {
      // Arrange
      const name = "testTool";
      const description = "A test tool";
      const type = AssistantToolType.GET;

      // Act
      const tool = new AssistantTool(
        name,
        description,
        type,
        testSchema,
        testFunction,
      );

      // Assert
      assertEquals(tool.name, name);
      assertEquals(tool.description, description);
      assertEquals(tool.type, type);
      assertEquals(tool.argsSchema, testSchema);
    });

    await t.step("execute method calls the function with provided args", async () => {
      // Arrange
      const tool = new AssistantTool(
        "testTool",
        "A test tool",
        AssistantToolType.GET,
        testSchema,
        testFunction,
      );
      const args = { id: "123", value: 42 };

      // Act
      const result = await tool.execute(args);

      // Assert
      assertEquals(result, { success: true, id: "123", value: 42 });
    });

    await t.step("execute method handles errors properly", async () => {
      // Arrange
      const errorFunction = () => {
        return Promise.reject(new Error("Test error"));
      };

      const tool = new AssistantTool(
        "errorTool",
        "A tool that throws an error",
        AssistantToolType.GET,
        testSchema,
        errorFunction,
      );

      const handleAppErrorStub = stub(
        { handleAppError },
        "handleAppError",
        (error, _fallbackDetails) => {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          throw new Error("Handled error: " + errorMessage);
        },
      );

      try {
        // Act & Assert
        await assertThrows(
          async () => await tool.execute({ id: "123" }),
          Error,
          "Handled error: Test error",
        );

        assertEquals(handleAppErrorStub.calls.length, 1);
        assertEquals(handleAppErrorStub.calls[0].args[1].code, AppErrorCode.INTERNAL_ERROR);
      } finally {
        handleAppErrorStub.restore();
      }
    });

    await t.step("defineOpenAITool returns correct OpenAI tool definition", () => {
      // Arrange
      const tool = new AssistantTool(
        "testTool",
        "A test tool",
        AssistantToolType.GET,
        testSchema,
        testFunction,
      );

      // Act
      const openAITool = tool.defineOpenAITool();

      // Assert
      assertEquals(openAITool.type, OpenAIToolType.FUNCTION);
      assertEquals(openAITool.function.name, "testTool");
      assertEquals(openAITool.function.description, "A test tool");
      assertExists(openAITool.function.parameters);

      // Check that the parameters include the schema properties
      const parameters = openAITool.function.parameters as Record<string, unknown>;
      assertExists(parameters.properties);
      assertExists((parameters.properties as Record<string, unknown>).id);
      assertExists((parameters.properties as Record<string, unknown>).value);
    });

    await t.step("validateArgs validates and returns valid args", () => {
      // Arrange
      const tool = new AssistantTool(
        "testTool",
        "A test tool",
        AssistantToolType.GET,
        testSchema,
        testFunction,
      );
      const validArgs = { id: "123", value: 42 };

      // Act
      const result = tool.validateArgs(validArgs);

      // Assert
      assertEquals(result, validArgs);
    });

    await t.step("validateArgs throws error for invalid args", () => {
      // Arrange
      const tool = new AssistantTool(
        "testTool",
        "A test tool",
        AssistantToolType.GET,
        testSchema,
        testFunction,
      );
      const invalidArgs = { value: "not a number" };

      // Act & Assert
      assertThrows(
        () => tool.validateArgs(invalidArgs),
        Error,
        "AssistantTool Validation Error",
      );
    });
  });
});
