# Migration Log

## Firestore to Neon Postgres Migration (Completed)

All application code has been migrated from Google Firestore to Neon PostgreSQL.

### Completed Tasks:
- All API routes use Neon database queries
- All server actions use Neon database queries
- All scripts use Neon database queries
- All Firebase SDK dependencies removed from package.json
- All Firebase library files deleted
- All Firebase config files deleted
- All Firebase scripts replaced with Neon equivalents

### Database:
- Primary database: Neon PostgreSQL (via `@neondatabase/serverless`)
- Schema: `database/schema.sql`
- Connection: `DATABASE_URL` environment variable
