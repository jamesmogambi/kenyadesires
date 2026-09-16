# Firestore to Neon Postgres Migration Guide

## Overview

This guide documents the migration from Google Firestore to Neon PostgreSQL for the KenyaDesires project.

## Schema Files

| File | Description |
|---|---|
| `database/schema.sql` | Complete PostgreSQL schema with all tables, indexes, and triggers |
| `scripts/migrate-firestore-to-neon.ts` | Data migration script (reads from Firestore, writes to Neon) |
| `app/lib/db.ts` | Neon database connection module |

## Tables Created

### Core Entities
| Firestore Collection | PostgreSQL Table | Notes |
|---|---|---|
| `escorts` | `escorts` | Complex: JSONB for nested objects, arrays for lists |
| `agencies` | `agencies` | Complex: JSONB for nested objects, arrays for lists |
| `blog` | `blog_posts` | JSONB for body content |
| `blogComments` | `blog_comments` | Simple documents |
| `counties` | `counties` | Lookup/reference data |
| `regions` | `regions` | Lookup/reference data |

### Transactions & Payments
| Firestore Collection | PostgreSQL Table |
|---|---|
| `transactions` | `transactions` |
| `whatsappCampaigns` | `whatsapp_campaigns` |
| `whatsappCampaignContacts` | `whatsapp_campaign_contacts` |

### Verification & Media
| Firestore Collection | PostgreSQL Table |
|---|---|
| `kyc_verifications` | `kyc_verifications` |
| `escort_images` | `escort_images` |
| `cleaningLogs` | `cleaning_logs` |
| `image_sync_trackers` | `image_sync_trackers` |

### System
| Firestore Collection | PostgreSQL Table |
|---|---|
| `processing_queue` | `processing_queue` |
| `processing_logs` | `processing_logs` |
| `contactSubmissions` | `contact_submissions` |
| `credit_rewards` (implied) | `credit_rewards` |
| Lookup collections | `lookup_*` tables |

## Key Design Decisions

1. **IDs**: Firestore auto-generated IDs → PostgreSQL `gen_random_uuid()` (preserves existing IDs via migration)
2. **Arrays**: Firestore arrays → PostgreSQL `TEXT[]` for string arrays, `JSONB` for complex arrays/objects
3. **Nested Objects**: Firestore Map fields → PostgreSQL `JSONB` (e.g., `opening_hours`, `locations`, `verification_documents`, `images_metadata`)
4. **Timestamps**: Firestore `Timestamp` → PostgreSQL `TIMESTAMP WITH TIME ZONE`
5. **Arrays of Objects**: Firestore arrays of complex objects → `JSONB` (e.g., `locations`, `rates`)

## Migration Steps

### 1. Run Schema
```bash
psql "$DATABASE_URL" -f database/schema.sql
```

### 2. Set Environment Variable
Ensure `DATABASE_URL` is set in `.env.local`:
```
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
```

### 3. Run Migration Script
```bash
npx tsx scripts/migrate-firestore-to-neon.ts
```

This script:
- Reads all documents from each Firestore collection
- Transforms Firestore-specific types (Timestamp, GeoPoint) to PostgreSQL equivalents
- Inserts into PostgreSQL with `ON CONFLICT (id) DO UPDATE` for safety
- Progress logging for large collections

### 4. Verify Migration
```bash
# Check record counts per table
psql "$DATABASE_URL" -c "
SELECT 'escorts' as table, count(*) FROM escorts
UNION ALL SELECT 'agencies', count(*) FROM agencies
UNION ALL SELECT 'blog_posts', count(*) FROM blog_posts
UNION ALL SELECT 'counties', count(*) FROM counties
UNION ALL SELECT 'regions', count(*) FROM regions
UNION ALL SELECT 'transactions', count(*) FROM transactions
UNION ALL SELECT 'blog_comments', count(*) FROM blog_comments;
"
```

## Next Steps: Application Code Migration

After data migration, the application code needs updating:

### Priority Order (most impactful first):

1. **Server Actions** (`server-actions/`)
   - `escort.action.ts` (1615 lines - largest)
   - `agency.action.ts` (1383 lines)
   - `payment.action.ts`
   - `campaign.action.ts`
   - `blog-comments.action.ts`
   - `search.action.ts`
   - `credit-rewards.action.ts`
   - `girl.action.ts`
   - All others

2. **API Routes** (`app/api/`)
   - All routes using `adminDb.collection()`

3. **Scripts** (`scripts/`)
   - Image cleaners
   - Data processing scripts

4. **Pages** (`app/`)
   - `sitemap.ts`
   - Pages that call server actions

### Pattern for Converting Server Actions:

**Firestore Read:**
```typescript
const snapshot = await adminDb.collection("escorts").where("isActive", "==", true).get();
const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
```

**Neon Equivalent:**
```typescript
const { rows } = await sql`SELECT * FROM escorts WHERE is_active = TRUE`;
```

**Firestore Write:**
```typescript
await adminDb.collection("escorts").doc(id).set(data);
```

**Neon Equivalent:**
```typescript
await sql`INSERT INTO escorts (id, name, ...) VALUES (${id}, ${name}, ...)
  ON CONFLICT (id) DO UPDATE SET name = ${name}, ...`;
```

## Important Notes

- **Backup your Firestore data** before running the migration script
- **Run migration in a transaction** if possible (or test on a staging database first)
- **Keep Firestore admin initialized** until migration is verified
- **Test thoroughly** after each server action migration
