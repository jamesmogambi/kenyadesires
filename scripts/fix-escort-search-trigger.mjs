import { Pool } from "pg";
import { readFileSync } from "fs";

function loadEnvFile(path: string) {
  const content = readFileSync(path, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env.development");
loadEnvFile(".env.production");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || databaseUrl.includes("user:password")) {
  console.error("DATABASE_URL is not set or is a placeholder");
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const sql = `CREATE OR REPLACE FUNCTION update_escort_search() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO escort_search (id, name, username, about, town, estate, categories, practices, search_vector)
    SELECT
        NEW.id,
        NEW.name,
        NEW.username,
        NEW.about,
        NEW.locations->>'town',
        NEW.locations->>'estate',
        NEW.categories,
        NEW.practices,
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.username, '') || ' ' || COALESCE(NEW.about, '')), 'A') ||
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', COALESCE(NEW.locations->>'town', '') || ' ' || COALESCE(NEW.locations->>'estate', '')), 'B') ||
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', array_to_string(NEW.categories, ' ')), 'C') ||
        SETWEIGHT(TO_TSVECTOR('pg_catalog.english', array_to_string(NEW.practices, ' ')), 'D')
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        username = EXCLUDED.username,
        about = EXCLUDED.about,
        town = EXCLUDED.town,
        estate = EXCLUDED.estate,
        categories = EXCLUDED.categories,
        practices = EXCLUDED.practices,
        search_vector = EXCLUDED.search_vector;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`;

async function main() {
  try {
    await pool.query(sql);
    console.log("Trigger function updated successfully");
  } catch (error) {
    console.error("Error updating trigger function:", error?.message || error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
