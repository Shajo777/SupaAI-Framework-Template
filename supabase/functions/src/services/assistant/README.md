# Assistant Service

## Overview

The Assistant Service enables the development of AI-powered conversational assistants with context
awareness, tool integration, and thread management. The service is now production-ready and provides
a complete solution for building sophisticated AI assistants. It leverages modern technologies such
as embeddings for semantic similarity search and provides a flexible API for creating specialized
assistants.

## Key Features

- **Type-Safe Configuration**: Full TypeScript support with Zod schema validation
- **Persistent Conversations**: Stores and manages conversation threads
- **Tool Integration**: Extensible through custom tools with automatic validation
- **Context Awareness**: Considers user context and previous messages
- **Semantic Search**: Finds similar previous messages for better responses
- **Entity Tracking**: Tracks created, updated, and deleted entities
- **Structured Responses**: Support for schema-validated structured data
- **Streaming Support**: Real-time token streaming for responsive UIs

## Installation and Setup

### Prerequisites

- Supabase project with database and authentication set up
- OpenAI API key for AI model access
- Database tables for threads and message embeddings

### Database Setup

The Assistant Service requires two database tables:

1. `assistant_threads`: Stores conversation threads
   ```sql
   CREATE TABLE assistant_threads (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     title TEXT,
     user_objectives JSONB DEFAULT '[]'::JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. `assistant_message_embeddings`: Stores messages with vector embeddings
   ```sql
   CREATE TABLE assistant_message_embeddings (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     thread_id UUID REFERENCES assistant_threads(id) ON DELETE CASCADE,
     block_index INTEGER NOT NULL,
     role TEXT NOT NULL,
     content TEXT NOT NULL,
     embedding VECTOR(1536),
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

3. Create a function for similarity search:
   ```sql
   CREATE OR REPLACE FUNCTION match_embeddings(
     query_embedding VECTOR(1536),
     similarity_threshold FLOAT,
     match_count INT,
     filter_thread_id UUID
   )
   RETURNS TABLE (
     id UUID,
     thread_id UUID,
     block_index INTEGER,
     role TEXT,
     content TEXT,
     embedding VECTOR(1536),
     created_at TIMESTAMPTZ,
     similarity FLOAT
   )
   LANGUAGE plpgsql
   AS $$
   BEGIN
     RETURN QUERY
     SELECT
       me.id,
       me.thread_id,
       me.block_index,
       me.role,
       me.content,
       me.embedding,
       me.created_at,
       1 - (me.embedding <=> query_embedding) AS similarity
     FROM
       assistant_message_embeddings me
     WHERE
       me.thread_id = filter_thread_id
       AND 1 - (me.embedding <=> query_embedding) > similarity_threshold
     ORDER BY
       me.embedding <=> query_embedding
     LIMIT match_count;
   END;
   $$;
   ```

### Environment Variables

Set the following environment variables:

```
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Quick Start Example: Weather Assistant

```typescript
import { z } from "zod";
import { Assistant } from "@src/services/assistant/assistant.service.ts";
import { AssistantTool, AssistantToolType } from "@src/services/assistant/tool.utils.ts";
import { OpenAIModel } from "@src/integrations/ai/ai.integration.ts";

// 1. Define context schema
const weatherContextSchema = z.object({
  location: z.string().optional(),
  units: z.enum(["metric", "imperial"]).optional().default("metric"),
});

// 2. Derive type from schema
type WeatherContext = z.infer<typeof weatherContextSchema>;

// 3. Create weather API tool
const getWeatherTool = new AssistantTool(
  "get_weather",
  "Get current weather data for a location",
  AssistantToolType.GET,
  z.object({
    location: z.string().describe("Location to retrieve weather data for"),
  }),
  async (args) => {
    // In a real application, this would be an API call
    return {
      temperature: 22,
      conditions: "sunny",
      humidity: 45,
      wind: {
        speed: 10,
        direction: "NW",
      },
    };
  },
);

// 4. Initialize assistant
const weatherAssistant = new Assistant<typeof weatherContextSchema>({
  title: "Weather Assistant",
  model: OpenAIModel.GPT4O,
  systemMessage: "You are a helpful weather assistant that provides current weather data.",
  contextSchema: weatherContextSchema,
  tools: [getWeatherTool],
  similarity: 0.7,
  matchCount: 3,
});

// 5. Use the assistant
async function askAboutWeather() {
  const response = await weatherAssistant.thread<WeatherContext>({
    message: "What's the weather like in Berlin today?",
    meta: { userId: "user123" },
    context: { location: "Berlin", units: "metric" },
  });

  console.log(response.message); // "In Berlin it's 22°C and sunny today..."
  console.log(response.threadId); // Thread ID for follow-up messages

  // Send a follow-up message in the same thread
  const followUpResponse = await weatherAssistant.thread<WeatherContext>({
    message: "And how will it be tomorrow?",
    meta: { userId: "user123", threadId: response.threadId },
    context: { location: "Berlin", units: "metric" },
  });

  console.log(followUpResponse.message);
}

askAboutWeather();
```

## Architecture

The Assistant Service follows a modular structure with clear separation of concerns:

```
AssistantRequest → Assistant.thread() → AssistantResponse
                        ↓
           ┌───────────┴───────────┐
           │                       │
    Thread Management        AI Processing
           │                       │
   Context Validation        Tool Execution
           │                       │
   Embeddings Search      Response Formatting
```

### Components

- **assistant.service.ts**: Main class for instantiating and controlling the assistant
- **tool.utils.ts**: Utilities for extending the assistant with custom functions
- **ai.utils.ts**: Integration with AI models and processing of AI responses
- **db.utils.ts**: Persistence of threads and message embeddings

## Detailed Usage Guide

### 1. Define Context Schema

Create a Zod schema that defines your assistant's context. The context schema is used to validate
the context data passed to the assistant:

```typescript
const productContextSchema = z.object({
  userId: z.string(),
  language: z.enum(["de", "en"]).default("en"),
  productId: z.string().optional(),
  preferences: z.object({
    showPrices: z.boolean().default(true),
    currency: z.enum(["USD", "EUR", "GBP"]).default("USD"),
  }).optional(),
});

type ProductContext = z.infer<typeof productContextSchema>;
```

### 2. Create Tools (optional)

Tools extend your assistant's capabilities by allowing it to perform actions or retrieve data:

```typescript
// Tool for retrieving product information
const getProductTool = new AssistantTool(
  "get_product",
  "Retrieve product information",
  AssistantToolType.GET,
  z.object({
    productId: z.string().describe("ID of the product"),
  }),
  async <T>(args: { productId: string }): Promise<T> => {
    // Retrieve product data from your service
    const product = await productService.getProduct(args.productId);
    return product as unknown as T;
  },
);

// Tool for creating orders
const createOrderTool = new AssistantTool(
  "create_order",
  "Create a new order",
  AssistantToolType.CREATE,
  z.object({
    productId: z.string().describe("ID of the product to order"),
    quantity: z.number().int().positive().describe("Number of items to order"),
    shippingAddress: z.string().optional().describe("Shipping address for the order"),
  }),
  async <T>(
    args: { productId: string; quantity: number; shippingAddress?: string },
  ): Promise<T> => {
    // Create order in your system
    const order = await orderService.createOrder(args);
    return {
      orderId: order.id,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      message: `Order created successfully for ${args.quantity} units of product ${args.productId}`,
    } as unknown as T;
  },
);
```

### 3. Configure Assistant

Create an instance of the Assistant class with your configuration:

```typescript
const productAssistant = new Assistant<typeof productContextSchema>({
  title: "Product Assistant",
  model: OpenAIModel.GPT4O,
  systemMessage: `You are a product advisor helping customers select and order products.
                 Use the available tools to retrieve product information and place orders.
                 Always confirm with the user before creating an order.
                 Respect the user's language preference in the context.`,
  contextSchema: productContextSchema,
  tools: [getProductTool, createOrderTool],
  similarity: 0.75, // Threshold for similarity search (0-1)
  matchCount: 5, // Number of similar messages to include
  onToken: (token) => {
    // Optional: Stream processing for tokens
    console.log(token);
  },
});
```

### 4. Use the Assistant in Your API

Integrate the assistant into your API routes:

```typescript
// Example API route handler
app.post("/api/assistant/chat", async (c) => {
  const { message, threadId } = await c.req.json();
  const userId = c.get("userId"); // From your auth middleware

  try {
    // Get user preferences from your database
    const userPreferences = await getUserPreferences(userId);

    // Call the assistant with the user's message and context
    const response = await productAssistant.thread<ProductContext>({
      message,
      meta: {
        userId,
        threadId, // Optional, will create a new thread if not provided
      },
      context: {
        userId,
        language: userPreferences.language || "en",
        preferences: {
          showPrices: userPreferences.showPrices,
          currency: userPreferences.currency,
        },
      },
    });

    // Process any entities that were created, updated, or deleted
    if (response.created && response.created.length > 0) {
      await processCreatedEntities(response.created);
    }

    return c.json({
      message: response.message,
      threadId: response.threadId,
    });
  } catch (error) {
    console.error("Assistant error:", error);
    return c.json({ error: "Failed to process message" }, 500);
  }
});
```

### 5. Structured Responses (optional)

For specific use cases, you can request structured responses from the assistant:

```typescript
// Define a schema for task analysis
const taskAnalysisSchema = z.object({
  title: z.string(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  estimatedTime: z.number().min(0),
  steps: z.array(z.string()),
  tags: z.array(z.string()),
});

type TaskAnalysis = z.infer<typeof taskAnalysisSchema>;

// Request a structured analysis of a task
const analyzeTask = async (taskDescription: string): Promise<TaskAnalysis> => {
  const result = await executeStructuredAICall(
    {
      model: OpenAIModel.GPT4O,
      systemMessage: "Analyze the following task and provide a structured breakdown.",
      messages: [{ role: ChatRole.User, content: taskDescription }],
    },
    taskAnalysisSchema,
    "task_analysis",
  );

  // Type-safe access to structured data
  return result.structuredData;
};

// Example usage
const taskAnalysis = await analyzeTask("Implement user authentication for the mobile app");
console.log(`Priority: ${taskAnalysis.priority}`);
console.log(`Estimated time: ${taskAnalysis.estimatedTime} hours`);
console.log("Steps:");
taskAnalysis.steps.forEach((step, index) => {
  console.log(`${index + 1}. ${step}`);
});
```

### 6. Error Handling

The Assistant Service uses a structured error handling system with the `AppError` class and helper
functions:

```typescript
import { AppErrorCode, handleAppError, throwAppError } from "@src/utils/error/error.utils.ts";

try {
  const response = await productAssistant.thread<ProductContext>({
    message: "I'm looking for a new smartphone",
    meta: { userId: "user123" },
    context: { language: "en" },
  });
} catch (error) {
  if (error instanceof AppError) {
    switch (error.code) {
      case AppErrorCode.UNAUTHORIZED:
        console.error("Authentication error:", error.message);
        break;
      case AppErrorCode.INTERNAL_ERROR:
        console.error("AI processing error:", error.message, error.context);
        break;
      case AppErrorCode.INTERNAL_ERROR:
        console.error("Tool execution failed:", error.message, error.context);
        break;
      default:
        console.error("Unexpected error:", error.message);
    }
  } else {
    // Handle non-AppError instances
    console.error("Unknown error:", error);
  }
}
```

Error helper functions:

- `throwAppError(details, originalError?)`: Creates and throws an AppError with detailed context
- `handleAppError(error, fallbackDetails)`: Handles errors gracefully, preserving the original error
  context

## Configuration Options

### Assistant Configuration

The `AssistantConfig` interface defines the configuration options for the Assistant:

| Option          | Type                    | Description                               | Required |
| --------------- | ----------------------- | ----------------------------------------- | -------- |
| `title`         | string                  | Title of the assistant                    | Yes      |
| `model`         | OpenAIModel             | AI model to use (e.g., GPT4O, GPT4)       | Yes      |
| `systemMessage` | string                  | Instructions for the AI                   | Yes      |
| `contextSchema` | z.ZodType               | Schema for validating context data        | Yes      |
| `tools`         | AssistantTool[]         | Available tools for the assistant         | No       |
| `onToken`       | (token: string) => void | Callback for streaming tokens             | No       |
| `similarity`    | number                  | Threshold for similarity search (0-1)     | Yes      |
| `matchCount`    | number                  | Maximum number of similar messages to use | Yes      |

### Request Configuration

The `AssistantRequest` interface defines the structure of requests to the assistant:

| Property  | Type                                  | Description                             | Required |
| --------- | ------------------------------------- | --------------------------------------- | -------- |
| `message` | string                                | The user's message                      | Yes      |
| `meta`    | { userId: string, threadId?: string } | User ID and optional thread ID          | Yes      |
| `context` | Generic type T                        | Context data validated by contextSchema | No       |
| `sources` | AssistantSource[]                     | Additional sources for the assistant    | No       |

### Response Structure

The `AssistantResponse` interface defines the structure of responses from the assistant:

| Property   | Type      | Description                                 |
| ---------- | --------- | ------------------------------------------- |
| `message`  | string    | The assistant's response message            |
| `threadId` | string    | ID of the conversation thread               |
| `created`  | unknown[] | Array of entities created during processing |
| `updated`  | unknown[] | Array of entities updated during processing |
| `deleted`  | unknown[] | Array of entities deleted during processing |

### Available Models

The `OpenAIModel` enum defines the available AI models:

```typescript
enum OpenAIModel {
  GPT35Turbo = "gpt-3.5-turbo",
  GPT4 = "gpt-4",
  GPT4O = "gpt-4o",
  GPT4Turbo = "gpt-4-turbo",
}
```

### Tool Types

The `AssistantToolType` enum defines the types of tools that can be created:

```typescript
enum AssistantToolType {
  GET = "get",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
}
```

## Entity Tracking

The Assistant Service can track entities that are created, updated, or deleted during a
conversation. This is useful for applications that need to know what changes were made by the AI.

### Using Entity Tracking in AI Responses

The AI can include information about created, updated, or deleted entities in its response using
special markers:

```
CREATED:
[
  {
    "id": "123",
    "type": "task",
    "title": "New task created"
  }
]

UPDATED:
[
  {
    "id": "456",
    "type": "appointment",
    "status": "confirmed"
  }
]

DELETED:
[
  {
    "id": "789",
    "type": "note"
  }
]
```

These markers can be included anywhere in the AI's response text. The Assistant Service will extract
this information and include it in the `created`, `updated`, and `deleted` arrays in the
`AssistantResponse`.

### System Message Example

To instruct the AI to use these markers, include instructions in your system message:

```typescript
const systemMessage = `You are a helpful assistant that manages tasks and appointments.

When you create, update, or delete entities, include them in your response using the following format:

CREATED:
[{"id": "unique-id", "type": "entity-type", ...other properties}]

UPDATED:
[{"id": "existing-id", "type": "entity-type", ...updated properties}]

DELETED:
[{"id": "removed-id", "type": "entity-type"}]
`;
```

## Best Practices and Tips

### System Message Design

The system message is crucial for guiding the assistant's behavior:

1. **Be Specific**: Clearly define the assistant's role, capabilities, and limitations
2. **Include Examples**: Provide examples of expected interactions when possible
3. **Define Output Format**: Specify how responses should be structured
4. **Set Boundaries**: Explicitly state what the assistant should not do
5. **Include Entity Tracking Instructions**: If using entity tracking, include instructions on when
   and how to use the CREATED, UPDATED, and DELETED markers

Example:

```
You are a customer support assistant for TechGadgets Inc.
Your role is to help customers with product inquiries, order status, and technical support.

When helping with orders:
1. Always verify the order number before providing details
2. Use the get_order_status tool to check current status
3. Never share personal information beyond what's needed for order verification

When a customer creates a new support ticket, include the ticket details using:
CREATED:
[{"id": "generated-id", "type": "support_ticket", "priority": "medium", "category": "technical"}]

Format your responses in a friendly, professional tone and always ask if there's anything else you can help with.
```

### Tool Design

Effective tool design improves the assistant's capabilities:

1. **Clear Naming**: Use descriptive names that indicate the tool's purpose
2. **Detailed Descriptions**: Provide clear descriptions for both the tool and its parameters
3. **Appropriate Types**: Use the correct AssistantToolType (GET, CREATE, UPDATE, DELETE)
4. **Parameter Validation**: Use Zod schemas to validate parameters and provide descriptive errors
5. **Error Handling**: Handle errors gracefully and return informative error messages
6. **Return Useful Data**: Structure return values to be useful for the assistant's response

### Performance Optimization

Optimize your assistant for better performance:

1. **Similarity Threshold**: Adjust the similarity threshold based on your use case (0.7-0.8 is a
   good starting point)
2. **Match Count**: Limit the number of similar messages to include (3-5 is usually sufficient)
3. **Context Size**: Keep context objects small and relevant
4. **System Message Length**: Keep system messages concise while still being comprehensive
5. **Use Streaming**: For user-facing applications, use the streaming API with the onToken callback
6. **Batch Processing**: For background tasks, use non-streaming mode for faster processing

### Security Considerations

Secure your assistant implementation:

1. **Input Validation**: Always validate user input before passing it to the assistant
2. **Authentication**: Ensure proper authentication for all assistant API endpoints
3. **Authorization**: Verify that users can only access their own threads
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Content Filtering**: Consider implementing content filtering for user messages
6. **Sensitive Data**: Avoid including sensitive data in messages or context

## Data Model

The Assistant Service uses the following data structures for persistence:

- **assistant_threads**: Stores conversation threads and metadata
- **assistant_message_embeddings**: Stores message contents with vector embeddings for semantic
  search

> **Note**: The `contextSchema` in the AssistantConfig is dynamic and defined at instantiation to
> support different context types.
