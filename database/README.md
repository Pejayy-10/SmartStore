# Database

SQLite database layer for SmartStore using expo-sqlite.

## Structure

- `schema.ts` - SQL table definitions
- `database.ts` - Database initialization and connection
- `migrations.ts` - Schema versioning and migrations
- `repositories/` - Data access layer (CRUD operations)

## Rules (per PROJECT_RULES.md)

- All database access goes through a data layer
- No raw queries in UI files
- Use transactions for multi-step writes
- Never delete records, use soft delete (`is_active`)
- Foreign key consistency
- Schema versioning required
