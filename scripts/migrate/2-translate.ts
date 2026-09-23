import { schemaFile, sqlFile, log, logSection } from './config';
import { Schema, TableInfo, ColumnInfo } from './types';
import { readFileSync, writeFileSync } from 'fs';

function mysqlQuoteIdent(name: string): string {
  return '`' + String(name).replace(/`/g, '``') + '`';
}

function mapType(col: ColumnInfo): string {
  const udt = (col.udt_name || '').toLowerCase();
  const dt = (col.data_type || '').toLowerCase();

  if (col.is_array) return 'JSON';

  if (col.is_enum && col.enum_values && col.enum_values.length) {
    const vals = col.enum_values
      .map((v) => `'${String(v).replace(/'/g, "''")}'`)
      .join(', ');
    return `ENUM(${vals})`;
  }

  switch (udt) {
    case 'int4':
    case 'integer':
      return 'INT';
    case 'int8':
    case 'bigint':
      return 'BIGINT';
    case 'int2':
    case 'smallint':
      return 'SMALLINT';
    case 'serial4':
    case 'serial':
      return 'INT';
    case 'serial8':
    case 'bigserial':
      return 'BIGINT';
    case 'bool':
    case 'boolean':
      return 'TINYINT(1)';
    case 'text':
      // TEXT cannot be a PK/UK/FK participant in MySQL (needs a prefix length),
      // and MySQL disallows prefix lengths in FOREIGN KEY clauses. Use VARCHAR(191)
      // so indexed TEXT columns work everywhere without special handling.
      return 'VARCHAR(191)';
    case 'varchar':
      return `VARCHAR(${col.character_maximum_length || 255})`;
    case 'bpchar':
    case 'char':
      return `VARCHAR(${col.character_maximum_length || 255})`;
    case 'uuid':
      return 'CHAR(36)';
    case 'json':
    case 'jsonb':
      return 'JSON';
    case 'timestamp':
    case 'timestamptz':
      return 'DATETIME';
    case 'date':
      return 'DATE';
    case 'numeric':
    case 'decimal':
      return `DECIMAL(${col.numeric_precision || 10},${col.numeric_scale || 0})`;
    case 'real':
    case 'float4':
    case 'double precision':
    case 'float8':
      return 'DOUBLE';
    case 'money':
      return 'DECIMAL(19,2)';
    case 'bytea':
      return 'LONGBLOB';
    case 'tsvector':
      return 'TEXT';
    case 'cidr':
      return 'VARCHAR(43)';
    case 'inet':
      return 'VARCHAR(45)';
    case 'interval':
      return 'VARCHAR(50)';
    default:
      // Fall back to VARCHAR(50) for any user-defined enum mapped to string.
      if (col.data_type === 'USER-DEFINED') {
        log(`[translate] WARN: USER-DEFINED udt '${col.udt_name}' on column '${col.column_name}' -> VARCHAR(50)`);
        return 'VARCHAR(50)';
      }
      log(`[translate] WARN: unmapped PG type udt='${col.udt_name}' data_type='${col.data_type}' for column '${col.column_name}' -> TEXT`);
      return 'TEXT';
  }
}

function isAutoSerial(col: ColumnInfo): boolean {
  return (
    (col.is_identity === 'YES') ||
    (!!col.column_default && /nextval/i.test(col.column_default))
  );
}

function translateDefault(col: ColumnInfo): string | null {
  const d = col.column_default;
  if (!d) return null;
  if (isAutoSerial(col)) return null; // handled via AUTO_INCREMENT

  const low = d.toLowerCase().trim();

  if (low === 'true') return '1';
  if (low === 'false') return '0';
  if (low === 'null') return null;

  if (/^now\(\)$/.test(low)) return 'CURRENT_TIMESTAMP';
  if (/^current_timestamp/.test(low)) return 'CURRENT_TIMESTAMP';
  if (/statement_timestamp|transaction_timestamp|clock_timestamp/.test(low)) return 'CURRENT_TIMESTAMP';
  if (/^'[^']*'::timestamp/.test(d) || /^'\([^']*\)'::timestamptz/.test(d)) return 'CURRENT_TIMESTAMP';
  if (/gen_random_uuid/.test(low)) return '(UUID())';
  if (/uuid_generate/.test(low)) return '(UUID())';

  if (/^-?\d+(\.\d+)?$/.test(low)) return low;

  // 'literal'::typename
  const casted = d.match(/^'([^']*)'\::([\w]+)(\[\])?$/);
  if (casted) {
    const inner = casted[1].replace(/'/g, "''");
    const typename = casted[2].toLowerCase();
    if (typename === 'boolean') return inner === 'true' ? '1' : '0';
    if (typename === 'text' || typename === 'varchar' || typename === 'bpchar' || typename === 'character') {
      return `'${inner}'`;
    }
    if (typename === 'date' || typename === 'timestamp' || typename === 'timestamptz') {
      return `'${inner}'`;
    }
    return `'${inner}'`;
  }

  // plain string literal '...'
  const plain = d.match(/^'(.*)'$/s);
  if (plain) {
    return `'${plain[1].replace(/'/g, "''")}'`;
  }

  log(`[translate] WARN: untranslatable default for column '${col.column_name}' (table TBD): ${d} -> omitted`);
  return null;
}

function buildColumnDef(col: ColumnInfo, table: TableInfo): string {
  const type = col.mysql_type || mapType(col);
  const auto = isAutoSerial(col);

  col.mysql_type = type;
  col.is_auto_increment = auto;
  col.mysql_default = auto ? null : translateDefault(col);

  // PK/UK/FK columns must be case-sensitive: PostgreSQL's default collation
  // (C/POSIX) is case-sensitive, but MySQL's utf8mb4_unicode_ci is not.
  // Without this, case-variant duplicate PKs (e.g. "Kiambu_thindigua" vs
  // "kiambu_thindigua") would silently collapse to one row.
  const isKeyColumn =
    table.primary_key.includes(col.column_name) ||
    table.unique_constraints.some((u) => u.columns.includes(col.column_name)) ||
    table.foreign_keys.some((f) => f.columns.includes(col.column_name));
  const collation = isKeyColumn ? ' COLLATE utf8mb4_bin' : '';

  let def = mysqlQuoteIdent(col.column_name) + ' ' + type + collation;
  if (col.is_nullable === 'NO') {
    def += ' NOT NULL';
  } else {
    def += ' NULL';
  }
  if (auto) {
    def += ' AUTO_INCREMENT';
  }
  if (col.mysql_default !== null && col.mysql_default !== undefined && !auto) {
    // MySQL rejects plain literal DEFAULTs on TEXT/BLOB/JSON columns; wrap them
    // in expression form DEFAULT (...) which is accepted. Numeric / boolean /
    // enum / varchar defaults keep the plain form.
    const needsExpr = /^(TEXT|JSON|LONGBLOB|BLOB|GEOMETRY)$/.test(type);
    const val = needsExpr ? `(${col.mysql_default})` : col.mysql_default;
    def += ` DEFAULT ${val}`;
  }
  return def;
}

function buildCreateTable(table: TableInfo): string {
  const defs: string[] = table.columns.map((c) => buildColumnDef(c, table));

  if (table.primary_key.length) {
    defs.push(`PRIMARY KEY (${table.primary_key.map(mysqlQuoteIdent).join(', ')})`);
  }

  // AUTO_INCREMENT columns that are not part of the PK need a unique key in MySQL.
  for (const c of table.columns) {
    if (c.is_auto_increment && !table.primary_key.includes(c.column_name)) {
      defs.push(`UNIQUE KEY ${mysqlQuoteIdent('uk_' + c.column_name)} (${mysqlQuoteIdent(c.column_name)})`);
    }
  }

  for (const u of table.unique_constraints) {
    defs.push(
      `UNIQUE KEY ${mysqlQuoteIdent(u.name)} (${u.columns.map(mysqlQuoteIdent).join(', ')})`
    );
  }

  return (
    `CREATE TABLE IF NOT EXISTS ${mysqlQuoteIdent(table.table_name)} (\n` +
    `  ${defs.join(',\n  ')}\n` +
    `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  );
}

function buildForeignKeyAlters(table: TableInfo): string[] {
  return table.foreign_keys.map((fk) => {
    const cols = fk.columns.map(mysqlQuoteIdent).join(', ');
    const refCols = fk.ref_columns.map(mysqlQuoteIdent).join(', ');
    const onDel = fk.on_delete ? ` ON DELETE ${fk.on_delete}` : '';
    const onUpd = fk.on_update ? ` ON UPDATE ${fk.on_update}` : '';
    return (
      `ALTER TABLE ${mysqlQuoteIdent(table.table_name)} ` +
      `ADD CONSTRAINT ${mysqlQuoteIdent(`fk_${table.table_name}_${fk.name}`)} ` +
      `FOREIGN KEY (${cols}) REFERENCES ${mysqlQuoteIdent(fk.ref_table)} (${refCols})${onDel}${onUpd}`
    );
  });
}

function main() {
  const schema: Schema = JSON.parse(readFileSync(schemaFile, 'utf8'));
  log(`[translate] Loaded ${schema.tables.length} tables from ${schemaFile}`);
  logSection('Table type mapping');

  const statements: string[] = ['SET FOREIGN_KEY_CHECKS=0'];

  for (const table of schema.tables) {
    const create = buildCreateTable(table);
    statements.push(create);
    const serials = table.columns.filter((c) => c.is_auto_increment);
    log(
      `[translate] ${table.table_name}: ${table.columns.length} cols, ` +
        `pk=[${table.primary_key.join(',')}], uk=${table.unique_constraints.length}, ` +
        `fk=${table.foreign_keys.length}, serials=[${serials.map((c) => c.column_name).join(',')}]`
    );
  }

  const alterCount = schema.tables.reduce((n, t) => n + t.foreign_keys.length, 0);
  log(`[translate] Emitting ${alterCount} foreign-key ALTER statements.`);

  for (const table of schema.tables) {
    for (const alter of buildForeignKeyAlters(table)) {
      statements.push(alter);
    }
  }

  statements.push('SET FOREIGN_KEY_CHECKS=1');

  const output = statements.join(';\n') + ';\n';
  writeFileSync(sqlFile, output);
  log(`[translate] Wrote schema.sql -> ${sqlFile}`);

  // Document the enum strategy decision.
  const enumTables = schema.tables.filter((t) =>
    t.columns.some((c) => c.is_enum && c.enum_values && c.enum_values.length)
  );
  log(
    `[translate] Enum strategy: Postgres enums mapped to MySQL ENUM(...) (preserves value ` +
      `constraints). ${enumTables.length} tables contain enum columns.`
  );
}

main();
