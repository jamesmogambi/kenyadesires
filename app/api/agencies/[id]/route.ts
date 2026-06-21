// app/api/agencies/[id]/route.ts (Get, Update, Delete)
import {NextRequest, NextResponse} from "next/server";
import AgencyService from "@/lib/services/agency.service";

// GET - Get agency by ID
export async function GET(
    request: NextRequest,
    {params}: { params: { id: string } },
) {
    try {
        const {id} = await params;
        // Try by ID first, then by slug
        let agency = await AgencyService.getAgencyById(id);

        if (!agency) {
            agency = await AgencyService.getAgencyBySlug(id);
        }

        if (!agency) {
            return NextResponse.json(
                {success: false, error: "Agency not found"},
                {status: 404},
            );
        }

        // Increment view count (async, don't await)
        AgencyService.incrementViewCount(id).catch(console.error);

        return NextResponse.json({
            success: true,
            data: agency,
        });
    } catch (error: any) {
        console.error("Error fetching agency:", error);
        return NextResponse.json(
            {success: false, error: error.message},
            {status: 500},
        );
    }
}

// PUT - Update agency
export async function PUT(
    request: NextRequest,
    {params}: { params: { id: string } },
) {
    try {
        const {id} = await params;
        const body = await request.json();

        const agency = await AgencyService.updateAgency(id, body);

        return NextResponse.json({
            success: true,
            data: agency,
            message: "Agency updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating agency:", error);
        return NextResponse.json(
            {success: false, error: error.message},
            {status: 500},
        );
    }
}

// DELETE - Delete agency
export async function DELETE(
    request: NextRequest,
    {params}: { params: { id: string } },
) {
    try {
        const {id} = await params;
        const searchParams = request.nextUrl.searchParams;
        const hardDelete = searchParams.get("hardDelete") === "true";

        await AgencyService.deleteAgency(id, hardDelete);

        return NextResponse.json({
            success: true,
            message: hardDelete
                ? "Agency permanently deleted"
                : "Agency deactivated successfully",
        });
    } catch (error: any) {
        console.error("Error deleting agency:", error);
        return NextResponse.json(
            {success: false, error: error.message},
            {status: 500},
        );
    }
}
