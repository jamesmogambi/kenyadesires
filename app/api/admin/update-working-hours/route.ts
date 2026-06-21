import {NextResponse} from "next/server";
import {adminDb} from "@/lib/firebase-admin";
import {FieldValue} from "firebase-admin/firestore";

/**
 * API Route to update all escort records with default working hours.
 * Default working hours: 08:00-23:00 for all days.
 */
export async function POST(request: Request) {
    try {
        // Security check - optional, but good to have.
        // If you want to restrict this to only development or authenticated admins, add it here.
        // if (process.env.NODE_ENV !== "development") { ... }

        console.log("🚀 Starting working hours update process for all escorts...");

        const escortsSnapshot = await adminDb.collection("escorts").get();
        const totalEscorts = escortsSnapshot.size;
        console.log(`📊 Found ${totalEscorts} escorts to process.`);

        let updatedCount = 0;
        let errorCount = 0;
        let batch = adminDb.batch();
        let batchCount = 0;
        const BATCH_LIMIT = 500;

        const defaultWorkingHours = {
            monday: {start: "08:00", end: "23:00", enabled: true},
            tuesday: {start: "08:00", end: "23:00", enabled: true},
            wednesday: {start: "08:00", end: "23:00", enabled: true},
            thursday: {start: "08:00", end: "23:00", enabled: true},
            friday: {start: "08:00", end: "23:00", enabled: true},
            saturday: {start: "08:00", end: "23:00", enabled: true},
            sunday: {start: "08:00", end: "23:00", enabled: true},
        };

        const defaultOpeningHours = {
            monday: "08:00-23:00",
            tuesday: "08:00-23:00",
            wednesday: "08:00-23:00",
            thursday: "08:00-23:00",
            friday: "08:00-23:00",
            saturday: "08:00-23:00",
            sunday: "08:00-23:00",
        };

        for (const doc of escortsSnapshot.docs) {
            try {
                const docRef = adminDb.collection("escorts").doc(doc.id);

                batch.update(docRef, {
                    workingHours: defaultWorkingHours,
                    openingHours: defaultOpeningHours,
                    // Also update availability to match if it exists or to be consistent
                    availability: defaultWorkingHours,
                    updatedAt: FieldValue.serverTimestamp(),
                });

                batchCount++;
                updatedCount++;

                if (batchCount >= BATCH_LIMIT) {
                    await batch.commit();
                    console.log(`📦 Committed batch of ${batchCount} escorts`);
                    batch = adminDb.batch();
                    batchCount = 0;
                }
            } catch (error) {
                console.error(`❌ Error processing escort ${doc.id}:`, error);
                errorCount++;
            }
        }

        if (batchCount > 0) {
            await batch.commit();
            console.log(`📦 Committed final batch of ${batchCount} escorts`);
        }

        console.log(`
    ✅ Update completed!
    📊 Total processed: ${totalEscorts}
    🔄 Updated: ${updatedCount}
    ❌ Errors: ${errorCount}
    `);

        return NextResponse.json({
            success: true,
            message: `Successfully updated working hours for ${updatedCount} escorts`,
            stats: {
                total: totalEscorts,
                updated: updatedCount,
                errors: errorCount,
            },
        });
    } catch (error) {
        console.error("Update failed:", error);
        return NextResponse.json(
            {
                error: "Failed to update escorts",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            {status: 500},
        );
    }
}

/**
 * GET endpoint to see what would be updated.
 */
export async function GET() {
    return NextResponse.json({
        message: "Use POST method to update all escorts with default working hours (08:00-23:00).",
        defaultWorkingHours: {
            monday: {start: "08:00", end: "23:00", enabled: true},
            tuesday: {start: "08:00", end: "23:00", enabled: true},
            wednesday: {start: "08:00", end: "23:00", enabled: true},
            thursday: {start: "08:00", end: "23:00", enabled: true},
            friday: {start: "08:00", end: "23:00", enabled: true},
            saturday: {start: "08:00", end: "23:00", enabled: true},
            sunday: {start: "08:00", end: "23:00", enabled: true},
        },
        defaultOpeningHours: {
            monday: "08:00-23:00",
            tuesday: "08:00-23:00",
            wednesday: "08:00-23:00",
            thursday: "08:00-23:00",
            friday: "08:00-23:00",
            saturday: "08:00-23:00",
            sunday: "08:00-23:00",
        }
    });
}
