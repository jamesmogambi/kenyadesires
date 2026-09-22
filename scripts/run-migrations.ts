import { Client } from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.development' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'database', 'migrations');

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('user:password')) {
    throw new Error('DATABASE_URL is not configured or is a placeholder');
  }
  return url;
}

function splitSql(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];

    if (inLineComment) {
      current += char;
      if (char === '\n') inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === '*' && nextChar === '/') {
        current += nextChar;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (char === '-' && nextChar === '-') {
        inLineComment = true;
        current += char;
        continue;
      }
      if (char === '/' && nextChar === '*') {
        inBlockComment = true;
        current += char;
        continue;
      }
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const trimmed = current.trim();
      if (trimmed) statements.push(trimmed);
      current = '';
      continue;
    }

    current += char;
  }

  const trimmed = current.trim();
  if (trimmed) statements.push(trimmed);

  return statements;
}

async function runMigrations() {
  const databaseUrl = getDatabaseUrl();
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log('✅ Connected to Neon\n');

    // Ensure migrations tracking table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        filename    TEXT NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const files = existsSync(MIGRATIONS_DIR)
      ? require('fs').readdirSync(MIGRATIONS_DIR).filter((f: string) => f.endsWith('.sql')).sort()
      : [];

    if (files.length === 0) {
      console.log('No migration files found.');
      return;
    }

    for (const file of files) {
      const applied = await client.query(
        'SELECT 1 FROM _migrations WHERE filename = $1',
        [file],
      );
      if (applied.rows.length > 0) {
        console.log(`⏭️  ${file} — already applied, skipping`);
        continue;
      }

      const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
      const statements = splitSql(sql);

      for (const statement of statements) {
        if (statement.trim()) {
          await client.query(statement);
        }
      }

      await client.query(
        'INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING',
        [file],
      );
      console.log(`✅ ${file} — applied`);
    }

    console.log('\n🎉 All migrations complete.');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();