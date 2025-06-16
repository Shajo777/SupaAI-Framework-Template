# tellsout Backend

## Prerequisites

- [Deno](https://deno.land/manual/getting_started/installation) (Version 2.x or higher)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Access to the project code

## Setup

### Environment Variables

Copy the `.env.example` file to `.env` in the functions directory and fill in the required values:

```bash
cp .env.example .env
```

### Supabase

Start Supabase locally:

```bash
# Start Supabase services
supabase start

# Stop Supabase services
supabase stop

# Reset the database (drops all data and reapplies migrations)
supabase db reset
```

### HTTP Client

Environment variables for the HTTP client are defined in:

- `http-client.env.json` - Environment variables for the HTTP client

### Dependencies

Deno doesn't require a separate installation step for dependencies, as they are automatically
downloaded when first running the code.

## Development

```bash
# Start development server
deno task dev

# Format code
deno task fmt

# Lint code
deno task lint

# Run Unit tests
deno task test:unit

# Run E2E tests 
deno task test:e2e

# Preconfiguration for test
# Put at the end of the command the file-path
deno task test:conf
```

---

## Pre-Commit Hook

The pre-commit hook automatically runs formatting, linting, and tests before each commit to ensure
code quality.

### Installation

When you clone the repository, the pre-commit hook is not automatically installed. You need to copy
it to the `.git/hooks` directory:

```bash
cp .github/scripts/pre-commit-hook .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

### Skipping Hooks

If you need to skip the pre-commit hook for a specific commit, you can use:

```bash
git commit -m "Your message" --no-verify
```
