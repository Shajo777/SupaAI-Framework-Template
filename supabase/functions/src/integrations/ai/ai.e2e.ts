import { ai } from "@src/integrations/ai/ai.integration.ts";
import { assertEquals } from "@std/assert";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { ChatRole, OpenAIModel } from "@src/integrations/ai/ai.integration.ts";

// Define the expected structure of the responseMessage using zod argsSchema
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  interests: z.array(z.string()),
});

// Type inference from the argsSchema
type UserInfo = z.infer<typeof userSchema>;

Deno.test("ai.integration.ts - get structured data from GPT", async (_t) => {
  // Create a chat completion with JSON responseMessage format using zod helper
  const response = await ai.chat.completions.create({
    model: OpenAIModel.GPT4O,
    messages: [
      {
        role: ChatRole.System,
        content: "You are a helpful assistant.",
      },
      {
        role: ChatRole.User,
        content: "Generate a user profile with name, age, and interests. Respond with JSON only.",
      },
    ],
    response_format: zodResponseFormat(userSchema, "user_profile"),
    temperature: 0.7,
  });

  // Get the content from the responseMessage and parse it
  const content = response.choices[0].message.content;
  const userData = JSON.parse(content || "{}") as UserInfo;

  // Verify the structure of the responseMessage
  assertEquals(typeof userData.name, "string", "Name should be a string");
  assertEquals(typeof userData.age, "number", "Age should be a number");
  assertEquals(
    Array.isArray(userData.interests),
    true,
    "Interests should be an array",
  );
});
