
# SupaAI Framework Template

> Enterprise-Ready AI Assistant Framework Powered by Supabase

A production-grade, type-safe framework for building AI-powered conversational assistants with Supabase integration, designed for enterprise applications with strict quality standards and scalable architecture.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com/)
[![Deno](https://img.shields.io/badge/Deno-000000?style=flat-square&logo=deno&logoColor=white)](https://deno.land/)
[![CI Status](https://img.shields.io/badge/CI-passing-success?style=flat-square&logo=github-actions&logoColor=white)](https://github.com/yourusername/assistant-framework/actions)

## 🚀 Features

- **🔒 Type-Safe Architecture**: End-to-end type safety with TypeScript and Zod schema validation
- **💬 Persistent Conversations**: Production-ready thread management with vector embeddings
- **🛠️ Tool Integration**: Extend functionality with custom tools and automatic validation
- **🧠 Context Awareness**: Intelligent context management across conversation threads
- **🔍 Semantic Search**: Vector-based similarity search for relevant conversation history
- **📊 Entity Tracking**: Structured tracking of created, updated, and deleted entities
- **📋 Schema Validation**: Runtime validation with Zod for robust data handling
- **⚡ Streaming Support**: Real-time token streaming for responsive user interfaces
- **🔄 CI/CD Pipeline**: Comprehensive testing and quality assurance workflow
- **🔐 Security-First**: Built-in authentication with Supabase Auth

## 📋 Overview

SupaAI Framework is an enterprise-grade solution for building sophisticated AI assistants that maintain context across conversations, integrate with external tools, and provide structured responses. Built on Supabase and OpenAI, it follows industry best practices for code quality, testing, and deployment:

- **Production-Ready Architecture**: Modular design with clear separation of concerns
- **Comprehensive Testing**: Unit tests, E2E tests, and pre-commit validation
- **Quality Assurance**: Linting, formatting, and type checking enforced via CI
- **Database Migration Handling**: Automated detection and application of schema changes
- **Standardized Development Workflow**: Consistent commit message format and branch strategy

## 🔧 Installation

### Prerequisites

- Supabase project with database and authentication
- OpenAI API key
- Deno (Version 2.x or higher)
- Supabase CLI
- Docker Desktop

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/supaai-framework.git
   cd supaai-framework
   ```

2. Set up environment variables:
   ```bash
   cp supabase/functions/.env.example supabase/functions/.env
   ```
   Edit the `.env` file to add your OpenAI API key and Supabase credentials.

3. Start Supabase locally:
   ```bash
   supabase start
   ```

4. Run database migrations:
   ```bash
   supabase db reset
   ```

5. Start the development server:
   ```bash
   cd supabase/functions
   deno task dev
   ```

## 📝 Quick Start Example

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
}

askAboutWeather();
```

## 🏗️ Architecture

The SupaAI Framework follows a production-grade architecture with clear separation of concerns:

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

### Key Components

- **assistant.service.ts**: Main class for instantiating and controlling the assistant
- **tool.utils.ts**: Utilities for extending the assistant with custom functions
- **ai.utils.ts**: Integration with AI models and processing of AI responses
- **db.utils.ts**: Persistence of threads and message embeddings

## 🛡️ Enterprise-Grade Quality

SupaAI Framework is built with enterprise standards at its core:

- **File Suffix-Based Architecture**: Consistent file organization (.service, .util, .spec, .e2e)
- **Three-Tier Test Structure**: Hierarchical testing approach for comprehensive coverage
- **Standardized Commit Format**: Structured commit messages with semantic prefixes
- **Pre-Commit Validation**: Automated quality checks before code is committed
- **CI Pipeline**: Automated testing, linting, and database migration handling
- **Error Handling System**: Structured error propagation with context preservation
- **Documentation Standards**: Clear inline documentation and comprehensive guides

## 🔍 Advanced Usage

For detailed usage instructions, configuration options, and advanced features, see the [Assistant Service Documentation](supabase/functions/src/services/assistant/README.md).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's coding style and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [OpenAI](https://openai.com/) for their powerful AI models
- [Supabase](https://supabase.com/) for database and authentication
- [Deno](https://deno.land/) for the runtime environment
- [Zod](https://github.com/colinhacks/zod) for schema validation

## 🔍 Keywords

ai, supabase, openai, assistant, chatbot, enterprise, framework, typescript, deno, vector-database, embeddings, context-aware, tool-integration, type-safe, production-ready
