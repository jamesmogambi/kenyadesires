import {NextResponse} from "next/server";
import {adminDb} from "@/lib/firebase-admin";

export async function GET(
    request: Request,
    {params}: { params: Promise<{ id: string }> }
) {
    try {
        const {id} = await params;

        if (!id) {
            return NextResponse.json(
                {success: false, error: "ID is required"},
                {status: 400}
            );
        }

        const doc = await adminDb.collection("escorts").doc(id).get();

        if (!doc.exists) {
            return NextResponse.json(
                {success: false, error: "Escort not found"},
                {status: 404}
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                id: doc.id,
                ...doc.data(),
            },
        });
    } catch (error) {
        console.error(`Failed to fetch escort:`, error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to fetch escort",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            {status: 500}
        );
    }
}

export async function DELETE(
    request: Request,
    {params}: { params: Promise<{ id: string }> }
) {
    let id: string | undefined;

    try {
        const paramsResult = await params;
        id = paramsResult.id;

        if (!id) {
            return NextResponse.json(
                {success: false, error: "ID is required"},
                {status: 400}
            );
        }

        const docRef = adminDb.collection("escorts").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json(
                {success: false, error: "Escort not found"},
                {status: 404}
            );
        }

        await docRef.delete();

        return NextResponse.json({
            success: true,
            message: `Escort with ID ${id} deleted successfully`,
        });
    } catch (error) {
        console.error(`Failed to delete escort ${id ?? "unknown"}:`, error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to delete escort",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            {status: 500}
        );
    }
}
