import { executeQuery } from "@/lib/neon";

async function saveCountyAndRegions(countyName: string, regionNames: string[]) {
  const existingRows: any[] = await executeQuery(
    `SELECT id FROM counties WHERE name = $1 LIMIT 1`,
    [countyName],
  );
  let countyId: string;

  if (existingRows.length > 0) {
    countyId = existingRows[0].id;
  } else {
    const id = crypto.randomUUID();
    await executeQuery(
      `INSERT INTO counties (id, name) VALUES ($1, $2)`,
      [id, countyName],
    );
    countyId = id;
  }

  for (const regionName of regionNames) {
    const existingRegion: any[] = await executeQuery(
      `SELECT id FROM regions WHERE name = $1 AND county_id = $2 LIMIT 1`,
      [regionName, countyId],
    );
    if (existingRegion.length === 0) {
      const regionId = crypto.randomUUID();
      await executeQuery(
        `INSERT INTO regions (id, name, county_id) VALUES ($1, $2, $3)`,
        [regionId, regionName, countyId],
      );
    }
  }
}

export async function saveCountiesAndRegions(
  countiesWithRegions: { county: string; regions: string[] }[]
) {
  for (const { county, regions } of countiesWithRegions) {
    await saveCountyAndRegions(county, regions);
  }
}

export const insertRegions = async (values: [string, number][]) => {
  for (const [region, countyId] of values) {
    const existingRegion: any[] = await executeQuery(
      `SELECT id FROM regions WHERE name = $1 AND county_id = $2 LIMIT 1`,
      [region, countyId],
    );
    if (existingRegion.length === 0) {
      const regionId = crypto.randomUUID();
      await executeQuery(
        `INSERT INTO regions (id, name, county_id) VALUES ($1, $2, $3)`,
        [regionId, region, countyId],
      );
    }
  }
};
