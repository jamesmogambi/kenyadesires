// import { NextResponse } from "next/server";
// import { MongoClient, ObjectId } from "mongodb";

// // MongoDB configuration
// const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
// const DATABASE_NAME = process.env.MONGODB_DATABASE || "escortDB";

// // Types
// interface Region {
//   _id: ObjectId;
//   name: string;
//   code?: string;
//   countyCode?: string;
//   isActive?: boolean;
// }

// interface Location {
//   region: string | ObjectId;
//   town: string;
//   estate: string;
//   address: string;
//   street: string;
//   postalCode: string;
//   isActive: boolean;
//   notes: string;
//   _id?: ObjectId;
// }

// interface Escort {
//   _id: ObjectId;
//   name: string;
//   regions: (string | ObjectId)[];
//   primaryRegion: string | ObjectId;
//   locations: Location[];
//   county: string | ObjectId;
//   countyCode?: string;
//   updatedAt?: Date;
// }

// export async function POST(request: Request) {
//   let client: MongoClient | null = null;

//   try {
//     // Security check - only allow in development
//     if (process.env.NODE_ENV !== "development") {
//       return NextResponse.json(
//         { error: "Migration only allowed in development environment" },
//         { status: 403 },
//       );
//     }

//     // Parse request body for options
//     const body = await request.json().catch(() => ({}));
//     const { dryRun = false, limit = 0 } = body;

//     console.log("🚀 Starting region migration...");
//     console.log(`📋 Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE UPDATE"}`);

//     // Connect to MongoDB
//     client = new MongoClient(MONGODB_URI);
//     await client.connect();
//     console.log("✅ Connected to MongoDB");

//     const db = client.db(DATABASE_NAME);

//     // Step 1: Get all regions and create mapping
//     const regionsCollection = db.collection<Region>("regions");
//     const regions = await regionsCollection.find({}).toArray();

//     const regionIdToName = new Map<string, string>();
//     const regionNameToId = new Map<string, string>();

//     regions.forEach((region) => {
//       const regionId = region._id.toString();
//       const regionName = region.name;
//       regionIdToName.set(regionId, regionName);
//       regionNameToId.set(regionName, regionId);
//     });

//     console.log(`✅ Loaded ${regionIdToName.size} regions`);

//     // Step 2: Get all escorts
//     const escortsCollection = db.collection<Escort>("escorts");
//     let query = {};

//     if (limit > 0) {
//       // For testing with limit
//       const sampleDocs = await escortsCollection
//         .find({})
//         .limit(limit)
//         .toArray();
//       var escorts = sampleDocs;
//     } else {
//       var escorts = await escortsCollection.find({}).toArray();
//     }

//     console.log(`📊 Processing ${escorts.length} escorts...`);

//     const results = {
//       total: escorts.length,
//       updated: 0,
//       skipped: 0,
//       errors: 0,
//       details: [] as any[],
//     };

//     // Step 3: Process each escort
//     for (const escort of escorts) {
//       try {
//         const updates: Partial<Escort> = {};
//         let needsUpdate = false;
//         const updateDetails: any = {
//           id: escort._id.toString(),
//           name: escort.name,
//           changes: [],
//         };

//         // 3.1 Update regions array
//         if (escort.regions && Array.isArray(escort.regions)) {
//           const updatedRegions: string[] = [];

//           for (const region of escort.regions) {
//             const regionId = region.toString();
//             const regionName = regionIdToName.get(regionId);

//             if (regionName) {
//               updatedRegions.push(regionName);
//               if (region !== regionName) {
//                 updateDetails.changes.push({
//                   field: "regions",
//                   from: regionId,
//                   to: regionName,
//                 });
//               }
//             } else {
//               updatedRegions.push(region.toString());
//             }
//           }

//           const hasChanges =
//             JSON.stringify(escort.regions) !== JSON.stringify(updatedRegions);
//           if (hasChanges) {
//             updates.regions = updatedRegions;
//             needsUpdate = true;
//           }
//         }

//         // 3.2 Update primaryRegion
//         if (escort.primaryRegion) {
//           const primaryId = escort.primaryRegion.toString();
//           const primaryName = regionIdToName.get(primaryId);

//           if (primaryName && escort.primaryRegion !== primaryName) {
//             updates.primaryRegion = primaryName;
//             needsUpdate = true;
//             updateDetails.changes.push({
//               field: "primaryRegion",
//               from: primaryId,
//               to: primaryName,
//             });
//           }
//         }

//         // 3.3 Update locations array region field
//         if (escort.locations && Array.isArray(escort.locations)) {
//           const updatedLocations = escort.locations.map((location) => {
//             const updatedLocation = { ...location };

//             if (location.region) {
//               const regionId = location.region.toString();
//               const regionName = regionIdToName.get(regionId);

//               if (regionName && updatedLocation.region !== regionName) {
//                 updatedLocation.region = regionName;
//                 updateDetails.changes.push({
//                   field: "locations[].region",
//                   from: regionId,
//                   to: regionName,
//                 });
//               }
//             }

//             return updatedLocation;
//           });

//           const hasChanges =
//             JSON.stringify(escort.locations) !==
//             JSON.stringify(updatedLocations);
//           if (hasChanges) {
//             updates.locations = updatedLocations as any;
//             needsUpdate = true;
//           }
//         }

//         // 3.4 Update county field (from ObjectId to county name)
//         if (escort.county && typeof escort.county !== "string") {
//           const countiesCollection = db.collection("counties");
//           const countyId = escort.county.toString();

//           // Try to find county by ObjectId
//           let county = null;
//           try {
//             county = await countiesCollection.findOne({
//               _id: new ObjectId(countyId),
//             });
//           } catch (error) {
//             // If not found by ObjectId, try by code
//             if (escort.countyCode) {
//               county = await countiesCollection.findOne({
//                 code: escort.countyCode,
//               });
//             }
//           }

//           if (county && county.name && escort.county !== county.name) {
//             updates.county = county.name;
//             needsUpdate = true;
//             updateDetails.changes.push({
//               field: "county",
//               from: countyId,
//               to: county.name,
//             });
//           }
//         }

//         // Apply updates if needed
//         if (needsUpdate) {
//           updates.updatedAt = new Date();

//           if (!dryRun) {
//             await escortsCollection.updateOne(
//               { _id: escort._id },
//               { $set: updates },
//             );
//           }

//           results.updated++;
//           results.details.push(updateDetails);
//           console.log(
//             `  ✅ ${escort.name}: ${updateDetails.changes.length} changes`,
//           );
//         } else {
//           results.skipped++;
//         }
//       } catch (error) {
//         console.error(`❌ Error processing escort ${escort.name}:`, error);
//         results.errors++;
//         results.details.push({
//           id: escort._id.toString(),
//           name: escort.name,
//           error: error instanceof Error ? error.message : "Unknown error",
//         });
//       }
//     }

//     console.log(`
//     ✅ Migration ${dryRun ? "preview" : "completed"}!
//     📊 Total escorts: ${results.total}
//     🔄 Updated: ${results.updated}
//     ⏭️ Skipped: ${results.skipped}
//     ❌ Errors: ${results.errors}
//     `);

//     return NextResponse.json({
//       success: true,
//       dryRun,
//       stats: {
//         total: results.total,
//         updated: results.updated,
//         skipped: results.skipped,
//         errors: results.errors,
//       },
//       details: results.details.slice(0, 100), // Limit details to first 100
//       message: dryRun
//         ? "Dry run completed. Send { dryRun: false } to apply changes."
//         : `Successfully migrated ${results.updated} escorts`,
//     });
//   } catch (error) {
//     console.error("Migration failed:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Migration failed",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 },
//     );
//   } finally {
//     if (client) {
//       await client.close();
//       console.log("🔌 Disconnected from MongoDB");
//     }
//   }
// }

// // GET endpoint to preview migration
// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const limit = parseInt(searchParams.get("limit") || "10");

//   // Reuse the POST logic with dryRun=true
//   const mockRequest = {
//     json: async () => ({ dryRun: true, limit }),
//   } as Request;

//   return POST(mockRequest);
// }

// // DELETE endpoint to rollback (convert names back to IDs)
// export async function DELETE(request: Request) {
//   let client: MongoClient | null = null;

//   try {
//     // Security check - only allow in development
//     if (process.env.NODE_ENV !== "development") {
//       return NextResponse.json(
//         { error: "Rollback only allowed in development environment" },
//         { status: 403 },
//       );
//     }

//     const body = await request.json().catch(() => ({}));
//     const { dryRun = false, limit = 0 } = body;

//     console.log("🔄 Starting rollback (names to IDs)...");

//     // Connect to MongoDB
//     client = new MongoClient(MONGODB_URI);
//     await client.connect();

//     const db = client.db(DATABASE_NAME);

//     // Get regions mapping (name to ID)
//     const regionsCollection = db.collection<Region>("regions");
//     const regions = await regionsCollection.find({}).toArray();

//     const regionNameToId = new Map<string, string>();
//     regions.forEach((region) => {
//       regionNameToId.set(region.name, region._id.toString());
//     });

//     console.log(`✅ Loaded ${regionNameToId.size} regions`);

//     // Get escorts
//     const escortsCollection = db.collection<Escort>("escorts");
//     let query = {};
//     if (limit > 0) {
//       var escorts = await escortsCollection.find({}).limit(limit).toArray();
//     } else {
//       var escorts = await escortsCollection.find({}).toArray();
//     }

//     let updatedCount = 0;

//     for (const escort of escorts) {
//       const updates: Partial<Escort> = {};
//       let needsUpdate = false;

//       // Rollback regions array
//       if (escort.regions && Array.isArray(escort.regions)) {
//         const updatedRegions = escort.regions.map((regionName) => {
//           const regionId = regionNameToId.get(regionName.toString());
//           return regionId || regionName;
//         });

//         if (JSON.stringify(escort.regions) !== JSON.stringify(updatedRegions)) {
//           updates.regions = updatedRegions as any;
//           needsUpdate = true;
//         }
//       }

//       // Rollback primaryRegion
//       if (escort.primaryRegion && typeof escort.primaryRegion === "string") {
//         const regionId = regionNameToId.get(escort.primaryRegion);
//         if (regionId && escort.primaryRegion !== regionId) {
//           updates.primaryRegion = regionId;
//           needsUpdate = true;
//         }
//       }

//       // Rollback locations
//       if (escort.locations && Array.isArray(escort.locations)) {
//         const updatedLocations = escort.locations.map((location) => {
//           const updatedLocation = { ...location };
//           if (typeof location.region === "string") {
//             const regionId = regionNameToId.get(location.region);
//             if (regionId) {
//               updatedLocation.region = regionId;
//             }
//           }
//           return updatedLocation;
//         });

//         if (
//           JSON.stringify(escort.locations) !== JSON.stringify(updatedLocations)
//         ) {
//           updates.locations = updatedLocations as any;
//           needsUpdate = true;
//         }
//       }

//       if (needsUpdate && !dryRun) {
//         updates.updatedAt = new Date();
//         await escortsCollection.updateOne(
//           { _id: escort._id },
//           { $set: updates },
//         );
//         updatedCount++;
//       }
//     }

//     return NextResponse.json({
//       success: true,
//       dryRun,
//       updated: updatedCount,
//       message: dryRun
//         ? "Rollback dry run completed"
//         : `Rolled back ${updatedCount} escorts`,
//     });
//   } catch (error) {
//     console.error("Rollback failed:", error);
//     return NextResponse.json(
//       {
//         error: "Rollback failed",
//         details: error instanceof Error ? error.message : "Unknown error",
//       },
//       { status: 500 },
//     );
//   } finally {
//     if (client) await client.close();
//   }
// }
