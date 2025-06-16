import { z } from "zod";
import Route from "@src/integrations/route/route.integration.ts";
import { Assistant } from "@src/services/assistant/assistant.service.ts";
import { AssistantTool, AssistantToolType } from "@src/services/assistant/tool.utils.ts";
import { OpenAIModel } from "@src/integrations/ai/ai.integration.ts";
import { AppError, AppErrorCode, getStatusCodeForError } from "@src/utils/error/error.utils.ts";

const weatherContextSchema = z.object({
  location: z.string().optional(),
  units: z.enum(["metric", "imperial"]).optional().default("metric"),
});

type WeatherContext = z.infer<typeof weatherContextSchema>;

const getWeatherTool = new AssistantTool(
  "get_weather",
  "Get current weather data for a location",
  AssistantToolType.GET,
  z.object({
    location: z.string().describe("Location to retrieve weather data for"),
  }),
  <T>(_args: { location: string }): Promise<T> => {
    // In a real application, this would be an API call
    // For this example, we return mock data
    return Promise.resolve({
      temperature: 22,
      conditions: "sunny",
      humidity: 45,
      wind: {
        speed: 10,
        direction: "NW",
      },
    } as unknown as T);
  },
);

const weatherAssistant = new Assistant<typeof weatherContextSchema>({
  title: "Weather Assistant",
  model: OpenAIModel.GPT4O,
  systemMessage: "You are a helpful weather assistant that provides current weather data.",
  contextSchema: weatherContextSchema,
  tools: [getWeatherTool],
  similarity: 0.7,
  matchCount: 3,
});

const route = Route("weather");

route.post("/", async (c) => {
  let requestBody;

  try {
    requestBody = await c.req.json();
    const { message, threadId, userId, location, units } = requestBody;
    const response = await weatherAssistant.thread<WeatherContext>({
      message,
      meta: {
        userId,
        threadId,
      },
      context: {
        location: location || "Berlin",
        units: units || "metric",
      },
    });

    return c.json(response);
  } catch (error) {
    console.error("Route Error: ", JSON.stringify(error, null, 2));

    if (error instanceof AppError) {
      return c.json({
        error: error.message,
        code: error.code,
        details: error.context,
      }, getStatusCodeForError(error.code));
    }

    return c.json({
      error: "Failed to process message",
      code: AppErrorCode.INTERNAL_ERROR,
    }, 500);
  }
});

export default route;
