# Supabase Migrations

## Naming Convention

Migration files follow this pattern:

```
yyyymmdd + index _ method_name_context.sql
```

### Example:

```
202506062_create_lessons_tables.sql
└─┬─────┘ └┬┘ └────────┬─────────┘
  │        │           └─ Descriptive name of what the migration does
  │        └─ Index number (for multiple migrations on the same day)
  └─ Date (Year-Month-Day)
```

### Rules:

- **Date**: Always use the current date in `yyyymmdd` format
- **Index**: Sequential number starting from 0 for multiple migrations on the
  same day
- **Method name**: Descriptive name using snake_case
- **Context**: What the migration affects (tables, views, functions, etc.)
