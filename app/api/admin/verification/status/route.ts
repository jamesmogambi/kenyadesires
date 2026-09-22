import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { sendVerificationNotificationEmail } from "@/server-actions/email";
import { awardVerificationCredits } from "@/server-actions/credit-rewards.action";
import { executeQuery } from "@/lib/neon";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userResult: any[] = await executeQuery(
      `SELECT * FROM users WHERE id = $1`,
      [userId],
    );
    const userRecord = userResult[0];

    if (!userRecord) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const userData = userRecord;
    const role = userData.role;

    const isAdmin =
      role === "admin" ||
      role === "superadmin" ||
      userData.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { type, id, status, decision }: {
      type: "escort" | "agency";
      id: string;
      status: "verified" | "rejected";
      decision?: string;
    } = body;

    if (!type || !id || !status) {
      return NextResponse.json(
        { error: "Missing required fields: type, id, status" },
        { status: 400 },
      );
    }

    if (!["verified", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'verified' or 'rejected'" },
        { status: 400 },
      );
    }

    const collectionName = type === "escort" ? "escorts" : "agencies";
    const columnId = type === "escort" ? "clerk_user_id" : "owner_id";

    const result: any[] = await executeQuery(
      `SELECT * FROM ${collectionName} WHERE ${columnId} = $1 LIMIT 1`,
      [id],
    );
    const snapshot = result[0];

    if (!snapshot) {
      return NextResponse.json(
        { error: `${type} profile not found` },
        { status: 404 },
      );
    }

    const existingData = snapshot;
    const email = existingData.email || existingData.contact_email || existingData.contactEmail;

    const updateData: any = {
      is_verified: status === "verified",
      verification_status: status,
      updated_at: new Date(),
    };

    if (decision) {
      updateData.verification_decision = decision;
    }

    const columns = Object.keys(updateData);
    const values = Object.values(updateData);
    const setClause = columns.map((c, i) => `${c} = $${i + 1}`).join(", ");

    await executeQuery(
      `UPDATE ${collectionName} SET ${setClause} WHERE id = $${columns.length + 1}`,
      [...values, id],
    );

    const clerkUserId = existingData.clerk_user_id || existingData.owner_id;
    const phone =
      existingData.telephone ||
      existingData.whatsapp_phone ||
      existingData.contact_phone ||
      "";

    let awardedCredits = 0;

    if (status === "verified" && clerkUserId) {
      const result = await awardVerificationCredits(
        clerkUserId,
        email || "",
        phone,
        type,
        id,
      );
      if (result.awarded) {
        awardedCredits = 50;
      }
    }

    if (email) {
      try {
        await sendVerificationNotificationEmail(
          email,
          existingData.name || existingData.contact_name || "User",
          status === "verified" ? "Approved" : "Declined",
          decision || null,
          awardedCredits,
          type,
        );
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    if (type === "escort") {
      const slug = existingData.slug;
      if (slug) {
        revalidatePath(`/girl/${slug}`);
      }
      revalidatePath(`/girl/${id}`);
      revalidatePath("/girls");
      revalidatePath("/administration");
    } else {
      revalidatePath(`/agency/${existingData.slug || id}`);
      revalidatePath("/agency-profile");
      revalidatePath("/agency-verification-status");
      revalidatePath("/administration");
    }

    return NextResponse.json({
      success: true,
      message: `Verification ${status} for ${type}`,
    });
  } catch (error: any) {
    console.error("Error updating verification status:", error);
    return NextResponse.json(
      { error: "internal_error", detail: error.message },
      { status: 500 },
    );
  }
}
