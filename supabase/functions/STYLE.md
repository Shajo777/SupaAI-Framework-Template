# Coding Style Guidelines

## Language Standard

**English Only**: This project adheres to a strict English-only policy for all text content.

## Comment

Add comments only when:

1. Function/variable names don't sufficiently explain purpose
2. Code implements complex or unusual logic
3. Code blocks exceed 10 lines and need section explanations

## Directory Structure

This project follows a file suffix-based architecture pattern:

- **.spec** - Unit test files for the associated module
- **.e2e** - End-to-End test files for the associated module
- **.util** - Utility functions and helper code
- **.service** - Service components implementing business logic
- **.types** - Type definitions and interfaces for the module
- **.val** - Zod validations
- **.schamas** - Schemas for e.g AI function-calls, responses
- **.messages** - System, Assistent messages
- aso.

If a code-feature requires more than one file `feature.util.ts` and `feature.spec.ts` we use a
directory wrapper `feature` directory.

## Test Structure

Tests in this project follow a hierarchical three-tier structure using `Deno.test` and `t.step`:

```typescript
// First wrapper for file
Deno.test("filename.ts", (fileC) => {
  // Second for function in file
  Deno.test("functionName", (funcC) => {
    // Testing Cases via steps
    t.step("describes a specific scenario", (stepC) => {});
  });
});
```

## API Architecture

The mein project lifes in `/src` each endpoint is a edge function declared in root
`/[function-name]` those import from `/src/routes`.

## Commit Messages

Commit messages should be clear, concise, and descriptive of the changes made. Each commit message
should follow this format:

```
<prefix>: <short summary>

[optional detailed description]
```

### Commit Prefixes

| Prefix     | Description                                             | Example                                 |
| ---------- | ------------------------------------------------------- | --------------------------------------- |
| `feat`     | New feature or enhancement                              | `feat: add user authentication`         |
| `fix`      | Bug fix                                                 | `fix: resolve login error on Safari`    |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor: simplify query logic`        |
| `docs`     | Documentation changes                                   | `docs: update API endpoints in README`  |
| `test`     | Adding or updating tests                                | `test: add unit tests for auth service` |
| `chore`    | Changes to build process, dependencies, etc.            | `chore: update TypeScript to v5.0`      |
| `style`    | Code style/formatting changes                           | `style: fix indentation in routes`      |
| `perf`     | Performance improvements                                | `perf: optimize database queries`       |

## Project Management

Pairing with AI in a project management approach:

- Before we tackle a task we write a `pm.md` file.
- After each prompt execution based on the projekct management tasks we update the `pm.md` file
  with:
  - Epic and Tickt done, misst
  - Commnts with openquestions, unclears
- While the process goes on, create additional tasks if needed.

```markdown
# <Epic Title>

<Goal or value of this Epic>

<Free‑text description of the Epic: scope, context, constraints.>

## TOC

- ✅ Ticket 1 – Short title (3) <- comment count
- ❌ Ticket 2 – Short title (1) <- comment count
- [ ] ...

---

## <Ticket Title>

### Why

_Stakeholder perspective – why does this ticket exist? What problem are we solving?_

### What _(optional)_

_Known solution ideas, architecture sketches, interfaces, DB approach …_

### Paths / Resources _(optional)_

_Folders, file paths, APIs, datasets, or earlier tickets the AI should use._

### How

_Acceptance criteria as a checklist._

- ❌ AC 1
- ✅ AC 2
- [ ] ...

### Assumptions _(optional)_

_Explicit assumptions the AI is making._

### Comments _(optional)_

_Open questions, links, notes, discussions._

---

<!-- ticket-end -->
```
