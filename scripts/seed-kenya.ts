import { counties, getWardsByCounty } from 'kenya-regions';
import * as dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const POPULAR_COUNTIES = new Set([
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Uasin Gishu',
  'Kiambu',
  'Machakos',
  'Meru',
  'Kakamega',
  'Bungoma',
  'Kilifi',
  'Homa Bay',
]);
const CHUNK_SIZE = 500;

async function addConstraint(connection: any, sql: string, label: string): Promise<void> {
  try {
    await connection.query(sql);
    console.log(`✅ Constraint added: ${label}`);
  } catch (error: any) {
    if (error.code === 'ER_DUP_KEYNAME' || error.code === 'ER_DUP_FIELDNAME' || error.message?.includes('already exists')) {
      console.log(`⏭️  Constraint already exists: ${label}`);
    } else if (error.message?.includes('foreign key') || error.message?.includes('Foreign key')) {
      console.warn(`⚠️  Could not add FK ${label}: existing data may violate it — ${error.message}`);
    } else {
      console.warn(`⚠️  Could not add constraint ${label}: ${error.message}`);
    }
  }
}

async function main() {
  const { default: mysqlPool } = await import('../lib/db');
  const connection = await mysqlPool.getConnection();

  try {
    // ── Step 4: Add constraints (outside transaction — ALTER TABLE commits implicitly) ──
    await addConstraint(
      connection,
      'ALTER TABLE counties ADD UNIQUE KEY uniq_counties_code (code)',
      'uniq_counties_code'
    );
    await addConstraint(
      connection,
      'ALTER TABLE regions ADD UNIQUE KEY uniq_regions_county_ward (county_code, name)',
      'uniq_regions_county_ward'
    );
    await addConstraint(
      connection,
      `ALTER TABLE regions ADD CONSTRAINT fk_regions_county
        FOREIGN KEY (county_id) REFERENCES counties(id) ON DELETE CASCADE`,
      'fk_regions_county'
    );

    // ── Step 1 & 2: Fetch and insert/update counties ──
    console.log('\n📥 Processing counties...');
    let countiesInserted = 0;
    let countiesUpdated = 0;

    for (const county of counties) {
      const codeStr = String(county.code);
      const isPopular = POPULAR_COUNTIES.has(county.name) ? 1 : 0;

      const [existing] = await connection.query(
        'SELECT id FROM counties WHERE name = ?',
        [county.name]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        await connection.query(
          `UPDATE counties SET
            code = ?, description = NULL, is_popular = ?, population = NULL,
            area = NULL, capital = NULL, updated_at = current_timestamp()
          WHERE id = ?`,
          [codeStr, isPopular, existing[0].id]
        );
        countiesUpdated++;
      } else {
        await connection.query(
          `INSERT INTO counties (name, code, description, is_popular, population, area, capital)
           VALUES (?, ?, NULL, ?, NULL, NULL, NULL)`,
          [county.name, codeStr, isPopular]
        );
        countiesInserted++;
      }
    }

    // ── Step 3: Build Map<countyCode, {id, name, code}> ──
    const [countyRows] = await connection.query('SELECT id, name, code FROM counties');
    const countyMap = new Map<string, { id: string; name: string; code: string }>();
    for (const row of countyRows as any[]) {
      countyMap.set(row.code, { id: row.id, name: row.name, code: row.code });
    }

    // ── Step 5: Fetch wards for each county ──
    console.log('\n📥 Fetching wards...');
    const allWards: any[] = [];
    const zeroWardCounties: string[] = [];

    for (const county of counties) {
      const wards = getWardsByCounty(county.code);
      console.log(`   ${county.name}: ${wards.length} wards`);

      if (wards.length === 0) {
        zeroWardCounties.push(county.name);
        continue;
      }

      const countyInfo = countyMap.get(String(county.code));
      if (!countyInfo) {
        console.warn(`   ⚠️  No county map entry for code ${county.code} (${county.name})`);
        continue;
      }

      const numericCode = String(county.code).replace(/^0+/, '') || '0';

      for (const ward of wards) {
        allWards.push([
          ward.name,
          countyInfo.code,
          countyInfo.name,
          numericCode,
          countyInfo.id,
          1,
          null,
          null,
          null,
          null,
          null,
          null,
        ]);
      }
    }

    // ── Step 5: Insert wards per county ──
    console.log(`\n📥 Inserting ${allWards.length} wards...`);
    let wardsInserted = 0;
    let wardsByCounty = new Map<string, number>();

    for (const county of counties) {
      const wards = getWardsByCounty(county.code);
      const countyInfo = countyMap.get(String(county.code));
      if (!countyInfo || wards.length === 0) continue;

      const numericCode = String(county.code).replace(/^0+/, '') || '0';
      const rows = wards.map((ward: any) => [
        ward.name,
        countyInfo.code,
        countyInfo.name,
        numericCode,
        countyInfo.id,
        1,
        null, null, null, null, null, null,
      ]);

      if (rows.length === 0) continue;

      const placeholders = rows.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const params = rows.flat();

      const [result] = await connection.query(
        `INSERT INTO regions (name, county_code, county, county_numeric_code, county_id, is_active, town, estate, address, street, postal_code, notes)
         VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE name = VALUES(name)`,
        params
      );
      const affected = (result as any).affectedRows || 0;
      wardsInserted += affected;
      wardsByCounty.set(county.name, affected);
      console.log(`   ${county.name}: ${wards.length} wards → ${affected} inserted/updated`);
    }

    await connection.commit();

    // ── Step 7: Final summary ──
    console.log('\n════════════════════════════════════════');
    console.log('  SEED COMPLETE');
    console.log('════════════════════════════════════════');
    console.log(`  Counties inserted:  ${countiesInserted}`);
    console.log(`  Counties updated:   ${countiesUpdated}`);
    console.log(`  Wards inserted:     ${wardsInserted}`);
    console.log(`  Zero-ward counties: ${zeroWardCounties.length}`);
    if (zeroWardCounties.length > 0) {
      console.log(`    ${zeroWardCounties.join(', ')}`);
    }
    console.log('════════════════════════════════════════\n');
  } catch (error) {
    try {
      await connection.rollback();
      console.error('\n❌ Transaction rolled back');
    } catch {
      // ignore rollback errors
    }
    console.error(error);
    process.exit(1);
  } finally {
    connection.release();
    await mysqlPool.end();
  }
}

void main();
