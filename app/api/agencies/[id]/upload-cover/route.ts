// app/api/agencies/[id]/upload-cover/route.ts
import {NextRequest, NextResponse} from "next/server";

export async function POST(
    request: NextRequest,
    {params}: { params: { id: string } },
) {
    try {
        const {id} = await params;

        return NextResponse.json(
            {success: false, error: "Firebase storage not available. This feature requires Firebase configuration."},
            {status: 503},
        );
    } catch (error: any) {
        console.error("Error uploading cover image:", error);
        return NextResponse.json(
            {success: false, error: error.message},
            {status: 500},
        );
    }
}

export async function DELETE(
    request: NextRequest,
    {params}: { params: { id: string } },
) {
    try {
        const {id} = await params;

        return NextResponse.json(
            {success: false, error: "Firebase storage not available. This feature requires Firebase configuration."},
            {status: 503},
        );
    } catch (error: any) {
        console.error("Error deleting cover image:", error);
        return NextResponse.json(
            {success: false, error: error.message},
            {status: 500},
        );
    }
}
