import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath, revalidateTag } from "next/cache";
import { sendVerificationNotificationEmail } from "@/server-actions/email";
import { awardVerificationCredits } from "@/server-actions/credit-rewards.action";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userRecord = await adminDb
      .collection("users")
      .doc(userId)
      .get();

    if (!userRecord.exists) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const userData = userRecord.data();
    const role = userData?.role;

    const isAdmin =
      role === "admin" ||
      role === "superadmin" ||
      userData?.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const {
      type,
      id,
      status,
      decision,
    }: {
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
    const docRef = adminDb.collection(collectionName).doc(id);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: `${type} profile not found` },
        { status: 404 },
      );
    }

    const existingData = snapshot.data() || {};
    const email = existingData.email || existingData.contactEmail;

    const updateData: any = {
      isVerified: status === "verified",
      verificationStatus: status,
      updatedAt: new Date(),
    };

    if (decision) {
      updateData.verificationDecision = decision;
    }

    await docRef.update(updateData);

    const clerkUserId = existingData.clerkUserId || existingData.ownerId;
    const phone =
      existingData.telephone ||
      existingData.whatsappPhone ||
      existingData.contactPhone ||
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
          existingData.name || existingData.contactName || "User",
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
