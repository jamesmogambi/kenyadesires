import { neonPool, neonUrl, schemaFile, log, closePools } from './config';
import { Schema, TableInfo, ColumnInfo, ForeignKey, UniqueConstraint, EnumInfo } from './types';
import { writeFileSync } from 'fs';

const PG_SCHEMA = process.env.PG_SCHEMA || 'public';

// Maps single-letter FK action codes returned by pg_catalog to MySQL words.
const FK_ACTION: Record<string, string> = {
  a: 'NO ACTION',
  r: 'RESTRICT',
  c: 'CASCADE',
  n: 'SET NULL',
  d: 'SET DEFAULT',
};

async function main() {
  log(`[introspect] Neon URL: ${neonUrl.replace(/:[^:@]*@/, ':*****@')}`);
  log(`[introspect] Target schema: ${PG_SCHEMA}`);

  // 1. Tables (BASE TABLE only)
  const tablesRes = await neonPool.query<{ table_name: string; table_type: string }>(
    `SELECT table_name, table_type
       FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name`,
    [PG_SCHEMA]
  );
  const tableNames = tablesRes.rows.map((r) => r.table_name);
  log(`[introspect] Found ${tableNames.length} base tables.`);

  // 2. Enum types via pg_type + pg_enum
  const enumRes = await neonPool.query<{ typname: string; enumlabel: string }>(
    `SELECT t.typname AS typname, e.enumlabel
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typtype = 'e'
      ORDER BY t.typname, e.enumsortorder`
  );
  const enumValues: Record<string, string[]> = {};
  for (const r of enumRes.rows) {
    (enumValues[r.typname] ||= []).push(r.enumlabel);
  }
  const enums: EnumInfo[] = Object.entries(enumValues).map(([type_name, values]) => ({
    type_name,
    values,
  }));
  log(`[introspect] Found ${enums.length} enum types.`);

  // 3. Columns
  const colsRes = await neonPool.query<{
    table_name: string;
    column_name: string;
    data_type: string | null;
    udt_name: string | null;
    is_nullable: string;
    column_default: string | null;
    character_maximum_length: number | null;
    numeric_precision: number | null;
    numeric_scale: number | null;
    ordinal_position: number;
    is_identity: string;
  }>(
    `SELECT c.table_name,
            c.column_name,
            c.data_type,
            c.udt_name,
            c.is_nullable,
            c.column_default,
            c.character_maximum_length,
            c.numeric_precision,
            c.numeric_scale,
            c.ordinal_position::int AS ordinal_position,
            c.is_identity
       FROM information_schema.columns c
      WHERE c.table_schema = $1
      ORDER BY c.table_name, c.ordinal_position`,
    [PG_SCHEMA]
  );

  const columnsByTable = new Map<string, ColumnInfo[]>();
  for (const c of colsRes.rows) {
    const udt = (c.udt_name || '').toLowerCase();
    const isEnum = enumValues[c.udt_name || ''] !== undefined;
    const col: ColumnInfo = {
      column_name: c.column_name,
      ordinal_position: Number(c.ordinal_position),
      data_type: c.data_type,
      udt_name: c.udt_name,
      is_nullable: (c.is_nullable.toLowerCase() === 'no' ? 'NO' : 'YES') as 'YES' | 'NO',
      column_default: c.column_default,
      character_maximum_length: c.character_maximum_length,
      numeric_precision: c.numeric_precision,
      numeric_scale: c.numeric_scale,
      is_identity: (c.is_identity === 'YES' ? 'YES' : 'NO') as 'YES' | 'NO',
      is_array: c.data_type === 'ARRAY',
      is_enum: isEnum,
      enum_values: isEnum ? enumValues[c.udt_name as string] : undefined,
    };
    const arr = columnsByTable.get(c.table_name) || [];
    arr.push(col);
    columnsByTable.set(c.table_name, arr);
  }

  // 4. PK / UNIQUE / FK constraints via pg_catalog
  // Fetch one row per constraint column instead of array_agg (the driver
  // returns array_agg results as raw "{a,b}" strings in this environment).

  // 4a. Primary keys + unique constraints
  const puRes = await neonPool.query<{
    conname: string;
    contype: string;
    table_name: string;
    column_name: string;
    col_ord: number;
  }>(
    `SELECT con.conname AS conname,
            con.contype AS contype,
            cl.relname AS table_name,
            la.attname AS column_name,
            gs AS col_ord
       FROM pg_constraint con
       JOIN pg_class cl ON cl.oid = con.conrelid
       JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace
       JOIN LATERAL generate_subscripts(con.conkey, 1) AS gs ON TRUE
       JOIN pg_attribute la ON la.attrelid = con.conrelid AND la.attnum = con.conkey[gs]
      WHERE nsp.nspname = $1 AND con.contype IN ('p', 'u')
      ORDER BY cl.relname, con.conname, gs`,
    [PG_SCHEMA]
  );

  // 4b. Foreign keys (local + referenced columns, matched by position)
  const fkRes = await neonPool.query<{
    conname: string;
    table_name: string;
    ref_table: string;
    on_update: string;
    on_delete: string;
    column_name: string;
    ref_column: string;
    col_ord: number;
  }>(
    `SELECT con.conname AS conname,
            cl.relname AS table_name,
            cl2.relname AS ref_table,
            con.confupdtype AS on_update,
            con.confdeltype AS on_delete,
            la.attname AS column_name,
            ra.attname AS ref_column,
            gs AS col_ord
       FROM pg_constraint con
       JOIN pg_class cl ON cl.oid = con.conrelid
       LEFT JOIN pg_class cl2 ON cl2.oid = con.confrelid
       JOIN pg_namespace nsp ON nsp.oid = cl.relnamespace
       JOIN LATERAL generate_subscripts(con.conkey, 1) AS gs ON TRUE
       JOIN pg_attribute la ON la.attrelid = con.conrelid AND la.attnum = con.conkey[gs]
       LEFT JOIN pg_attribute ra ON ra.attrelid = con.confrelid AND ra.attnum = con.confkey[gs]
      WHERE nsp.nspname = $1 AND con.contype = 'f'
      ORDER BY cl.relname, con.conname, gs`,
    [PG_SCHEMA]
  );

  const pkByTable = new Map<string, string[]>();
  const ukByTable = new Map<string, UniqueConstraint[]>();
  const fkByTable = new Map<string, ForeignKey[]>();

  for (const r of puRes.rows) {
    if (r.contype === 'p') {
      const arr = pkByTable.get(r.table_name) || [];
      arr.push(r.column_name);
      pkByTable.set(r.table_name, arr);
    } else if (r.contype === 'u') {
      let tlist = ukByTable.get(r.table_name);
      if (!tlist) {
        tlist = [];
        ukByTable.set(r.table_name, tlist);
      }
      let u = tlist.find((x) => x.name === r.conname);
      if (!u) {
        u = { name: r.conname, columns: [] };
        tlist.push(u);
      }
      u.columns.push(r.column_name);
    }
  }

  for (const r of fkRes.rows) {
    let list = fkByTable.get(r.table_name);
    if (!list) {
      list = [];
      fkByTable.set(r.table_name, list);
    }
    let f = list.find((x) => x.name === r.conname);
    if (!f) {
      f = {
        name: r.conname,
        columns: [],
        ref_table: r.ref_table,
        ref_columns: [],
        on_delete: FK_ACTION[r.on_delete] || undefined,
        on_update: FK_ACTION[r.on_update] || undefined,
      };
      list.push(f);
    }
    f.columns.push(r.column_name);
    f.ref_columns.push(r.ref_column);
  }

  // Assemble schema
  const schema: Schema = {
    db_schema: PG_SCHEMA,
    generated_at: new Date().toISOString(),
    type_mapping_note:
      'PostgreSQL -> MySQL maps: int4->INT, int8->BIGINT, int2->SMALLINT, serial/bigserial->AUTO_INCREMENT, ' +
      'boolean->TINYINT(1), text/varchar->TEXT/VARCHAR(n), uuid->CHAR(36), json/jsonb->JSON, ' +
      'timestamp/timestamptz->DATETIME, date->DATE, numeric->DECIMAL(p,s), real/float8->DOUBLE, bytea->LONGBLOB, ' +
      'arrays->JSON, enums->ENUM(values).',
    enums_as_enum_note:
      'Postgres enum types are mapped to MySQL ENUM(value, ...) to preserve the value constraint. ' +
      'Enums containing invalid MySQL ENUM characters fall back to VARCHAR(50).',
    tables: tableNames.map((name): TableInfo => {
      return {
        table_name: name,
        table_type: 'BASE TABLE',
        columns: columnsByTable.get(name) || [],
        primary_key: pkByTable.get(name) || [],
        unique_constraints: ukByTable.get(name) || [],
        foreign_keys: fkByTable.get(name) || [],
        indexes: [],
      };
    }),
    enums,
  };

  writeFileSync(schemaFile, JSON.stringify(schema, null, 2));
  log(`[introspect] Wrote ${schema.tables.length} tables / ${enums.length} enums -> ${schemaFile}`);
  await closePools();
  log('[introspect] Done.');
}

main().catch(async (err) => {
  console.error('[introspect] FATAL:', err);
  await closePools();
  process.exit(1);
});
