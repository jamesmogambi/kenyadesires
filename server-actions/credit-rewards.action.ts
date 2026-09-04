"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  CREDIT_REWARDS,
  CREDIT_VALUE_KSH,
  CreditRewardRecord,
  AwardedMilestone,
  MilestoneId,
  ProviderType,
  MAX_WELCOME_CREDITS,
} from "@/lib/credit-rewards";

const REWARDS_COLLECTION = "credit_rewards";

interface MilestoneAwardResult {
  awarded: boolean;
  alreadyAwarded: boolean;
  creditsAwarded: number;
  totalCreditsAwarded: number;
  error?: string;
}

function emptyMilestoneAwarded(credits: number): AwardedMilestoneEntry {
  return {
    awarded: false,
    awardedAt: null,
    credits,
  };
}

interface AwardedMilestoneEntry {
  awarded: boolean;
  awardedAt: Date | null;
  credits: number;
}

function serializeRewardRecord(
  doc: FirebaseFirestore.DocumentSnapshot,
): CreditRewardRecord | null {
  if (!doc.exists) return null;
  const data = doc.data()!;
  const milestones: Record<MilestoneId, AwardedMilestone> = {
    account_created: {
      awarded: data.awardedMilestones?.account_created?.awarded ?? false,
      awardedAt: data.awardedMilestones?.account_created?.awardedAt
        ?.toDate?.() ??
        null,
      credits: data.awardedMilestones?.account_created?.credits ?? 10,
    },
    profile_complete: {
      awarded: data.awardedMilestones?.profile_complete?.awarded ?? false,
      awardedAt: data.awardedMilestones?.profile_complete?.awardedAt
        ?.toDate?.() ??
        null,
      credits: data.awardedMilestones?.profile_complete?.credits ?? 20,
    },
    verified: {
      awarded: data.awardedMilestones?.verified?.awarded ?? false,
      awardedAt: data.awardedMilestones?.verified?.awardedAt
        ?.toDate?.() ??
        null,
      credits: data.awardedMilestones?.verified?.credits ?? 50,
    },
  };
  return {
    clerkUserId: data.clerkUserId,
    email: data.email || "",
    phone: data.phone || "",
    providerType: data.providerType,
    providerId: data.providerId || "",
    awardedMilestones: milestones,
    totalCreditsAwarded: data.totalCreditsAwarded || 0,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  };
}

export async function getCreditRewardRecord(
  clerkUserId: string,
): Promise<CreditRewardRecord | null> {
  if (!clerkUserId) return null;
  const doc = await adminDb
    .collection(REWARDS_COLLECTION)
    .doc(clerkUserId)
    .get();
  return serializeRewardRecord(doc);
}

export async function getCreditRewardRecordByIdentifier(
  clerkUserId: string,
  email?: string,
): Promise<CreditRewardRecord | null> {
  const byClerk = await getCreditRewardRecord(clerkUserId);
  if (byClerk) return byClerk;

  if (email && email.trim()) {
    const emailNormalized = email.trim().toLowerCase();
    const snap = await adminDb
      .collection(REWARDS_COLLECTION)
      .where("email", "==", emailNormalized)
      .limit(1)
      .get();
    if (!snap.empty) {
      return serializeRewardRecord(snap.docs[0]);
    }
  }

  return null;
}

export async function hasMilestoneBeenAwarded(
  clerkUserId: string,
  milestoneId: MilestoneId,
): Promise<boolean> {
  const record = await getCreditRewardRecord(clerkUserId);
  if (!record) return false;
  return record.awardedMilestones[milestoneId]?.awarded ?? false;
}

export async function awardMilestoneCredits(
  clerkUserId: string,
  milestoneId: MilestoneId,
  identifiableInfo: {
    email?: string;
    phone?: string;
  },
  providerInfo: {
    providerType: ProviderType;
    providerId: string;
  },
): Promise<MilestoneAwardResult> {
  if (!clerkUserId || !milestoneId) {
    return {
      awarded: false,
      alreadyAwarded: false,
      creditsAwarded: 0,
      totalCreditsAwarded: 0,
      error: "Missing required parameters",
    };
  }

  const milestone = CREDIT_REWARDS[milestoneId];
  if (!milestone) {
    return {
      awarded: false,
      alreadyAwarded: false,
      creditsAwarded: 0,
      totalCreditsAwarded: 0,
      error: "Invalid milestone",
    };
  }

  const emailNormalized = (identifiableInfo.email || "").trim().toLowerCase();
  const phoneNormalized = (identifiableInfo.phone || "").replace(/\D/g, "");

  try {
    const existingByClerk = await getCreditRewardRecord(clerkUserId);
    if (existingByClerk) {
      if (existingByClerk.awardedMilestones[milestoneId]?.awarded) {
        return {
          awarded: false,
          alreadyAwarded: true,
          creditsAwarded: 0,
          totalCreditsAwarded: existingByClerk.totalCreditsAwarded,
        };
      }

      if (
        emailNormalized &&
        existingByClerk.email &&
        existingByClerk.email.toLowerCase() !== emailNormalized
      ) {
        const emailCheck = await adminDb
          .collection(REWARDS_COLLECTION)
          .where("email", "==", emailNormalized)
          .limit(1)
          .get();
        if (!emailCheck.empty) {
          const existingRecord = serializeRewardRecord(emailCheck.docs[0])!;
          if (existingRecord.awardedMilestones[milestoneId]?.awarded) {
            return {
              awarded: false,
              alreadyAwarded: true,
              creditsAwarded: 0,
              totalCreditsAwarded: existingRecord.totalCreditsAwarded,
            };
          }
        }
      }

      const updateData: any = {
        [`awardedMilestones.${milestoneId}.awarded`]: true,
        [`awardedMilestones.${milestoneId}.awardedAt`]: Timestamp.now(),
        [`awardedMilestones.${milestoneId}.credits`]: milestone.credits,
        totalCreditsAwarded: FieldValue.increment(milestone.credits),
        updatedAt: Timestamp.now(),
      };

      if (emailNormalized) updateData.email = emailNormalized;
      if (phoneNormalized) updateData.phone = phoneNormalized;

      await adminDb
        .collection(REWARDS_COLLECTION)
        .doc(clerkUserId)
        .update(updateData);

      const providerRef = await findProviderRef(
        clerkUserId,
        providerInfo.providerType,
      );
      if (providerRef) {
        await providerRef.update({
          credits: FieldValue.increment(milestone.credits),
          updatedAt: Timestamp.now(),
        });
      }

      await logRewardTransaction(
        clerkUserId,
        milestoneId,
        milestone.credits,
        emailNormalized,
        phoneNormalized,
      );

      revalidatePath("/extend");
      revalidatePath("/administration");

      return {
        awarded: true,
        alreadyAwarded: false,
        creditsAwarded: milestone.credits,
        totalCreditsAwarded:
          (existingByClerk.totalCreditsAwarded || 0) + milestone.credits,
      };
    }

    const newRecord: Partial<CreditRewardRecord> = {
      clerkUserId,
      email: emailNormalized,
      phone: phoneNormalized,
      providerType: providerInfo.providerType,
      providerId: providerInfo.providerId,
      awardedMilestones: {
        account_created: { awarded: false, awardedAt: null, credits: 10 },
        profile_complete: { awarded: false, awardedAt: null, credits: 20 },
        verified: { awarded: false, awardedAt: null, credits: 50 },
      },
      totalCreditsAwarded: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb
      .collection(REWARDS_COLLECTION)
      .doc(clerkUserId)
      .set(newRecord, { merge: true });

    const updateData: any = {
      [`awardedMilestones.${milestoneId}.awarded`]: true,
      [`awardedMilestones.${milestoneId}.awardedAt`]: Timestamp.now(),
      [`awardedMilestones.${milestoneId}.credits`]: milestone.credits,
      totalCreditsAwarded: FieldValue.increment(milestone.credits),
      updatedAt: Timestamp.now(),
    };

    if (emailNormalized) updateData.email = emailNormalized;
    if (phoneNormalized) updateData.phone = phoneNormalized;

    await adminDb
      .collection(REWARDS_COLLECTION)
      .doc(clerkUserId)
      .update(updateData);

    const providerRef = await findProviderRef(
      clerkUserId,
      providerInfo.providerType,
    );
    if (providerRef) {
      await providerRef.update({
        credits: FieldValue.increment(milestone.credits),
        updatedAt: Timestamp.now(),
      });
    }

    await logRewardTransaction(
      clerkUserId,
      milestoneId,
      milestone.credits,
      emailNormalized,
      phoneNormalized,
    );

    revalidatePath("/extend");
    revalidatePath("/administration");

    return {
      awarded: true,
      alreadyAwarded: false,
      creditsAwarded: milestone.credits,
      totalCreditsAwarded: milestone.credits,
    };
  } catch (error: any) {
    console.error(`Error awarding ${milestoneId} credits:`, error);
    return {
      awarded: false,
      alreadyAwarded: false,
      creditsAwarded: 0,
      totalCreditsAwarded: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function findProviderRef(
  clerkUserId: string,
  providerType: ProviderType,
): Promise<FirebaseFirestore.DocumentReference | null> {
  if (!clerkUserId) return null;

  const escortDoc = await adminDb.collection("escorts").doc(clerkUserId).get();
  if (escortDoc.exists) {
    return escortDoc.ref;
  }

  const agencyDoc = await adminDb.collection("agencies").doc(clerkUserId).get();
  if (agencyDoc.exists) {
    return agencyDoc.ref;
  }

  if (providerType === "escort") {
    const escortSnap = await adminDb
      .collection("escorts")
      .where("clerkUserId", "==", clerkUserId)
      .limit(1)
      .get();
    if (!escortSnap.empty) {
      return escortSnap.docs[0].ref;
    }
  } else {
    const agencySnap = await adminDb
      .collection("agencies")
      .where("ownerId", "==", clerkUserId)
      .limit(1)
      .get();
    if (!agencySnap.empty) {
      return agencySnap.docs[0].ref;
    }
  }

  return null;
}

async function logRewardTransaction(
  clerkUserId: string,
  milestoneId: MilestoneId,
  credits: number,
  email: string,
  phone: string,
): Promise<void> {
  try {
    const txRef = adminDb.collection("transactions").doc();
    await txRef.set({
      userId: clerkUserId,
      type: "credit_reward",
      milestoneId,
      credits,
      amount: credits * CREDIT_VALUE_KSH,
      currency: "KSH",
      status: "completed",
      phoneNumber: phone.replace(/\D/g, ""),
      accountReference: `REWARD-${milestoneId}`,
      transactionDesc: `Welcome reward: ${CREDIT_REWARDS[milestoneId].label} (${credits} credits)`,
      checkoutRequestId: txRef.id,
      merchantRequestId: `reward-${milestoneId}-${Date.now()}`,
      createdAt: Timestamp.now(),
      completedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } catch (error: any) {
    console.error("Error logging reward transaction:", error);
  }
}

export async function awardAccountCreationCredits(
  clerkUserId: string,
  email: string,
  phone: string,
  providerType: ProviderType,
  providerId: string,
): Promise<MilestoneAwardResult> {
  return awardMilestoneCredits(clerkUserId, "account_created", { email, phone }, { providerType, providerId });
}

export async function awardProfileCompleteCredits(
  clerkUserId: string,
  email: string,
  phone: string,
  providerType: ProviderType,
  providerId: string,
): Promise<MilestoneAwardResult> {
  return awardMilestoneCredits(
    clerkUserId,
    "profile_complete",
    { email, phone },
    { providerType, providerId },
  );
}

export async function awardVerificationCredits(
  clerkUserId: string,
  email: string,
  phone: string,
  providerType: ProviderType,
  providerId: string,
): Promise<MilestoneAwardResult> {
  return awardMilestoneCredits(
    clerkUserId,
    "verified",
    { email, phone },
    { providerType, providerId },
  );
}

export async function checkAndAwardProfileCompletion(
  clerkUserId: string,
  profileData: Record<string, any>,
  providerType: ProviderType,
  providerId: string,
): Promise<MilestoneAwardResult> {
  const email = profileData.email || profileData.contactEmail || "";
  const phone = profileData.telephone || profileData.whatsappPhone || profileData.contactPhone || "";

  const milestone = CREDIT_REWARDS.profile_complete;
  if (!milestone) {
    return {
      awarded: false,
      alreadyAwarded: false,
      creditsAwarded: 0,
      totalCreditsAwarded: 0,
      error: "Invalid milestone",
    };
  }

  const requiredFields =
    providerType === "escort"
      ? [
          "name",
          "email",
          "previewPhoto",
          "about",
          "county",
          "primaryRegion",
          "age",
        ]
      : ["name", "contactEmail", "county", "region", "businessType"];

  const hasArrays =
    providerType === "escort"
      ? ["images", "categories", "languages"].every(
          (f) =>
            Array.isArray(profileData[f]) && profileData[f].length > 0,
        )
      : true;

  const hasRequiredFields = requiredFields.every(
    (field) => {
      const val = profileData[field];
      if (typeof val === "string") return val.trim().length > 0;
      return val != null;
    },
  );

  if (!hasRequiredFields || !hasArrays) {
    return {
      awarded: false,
      alreadyAwarded: false,
      creditsAwarded: 0,
      totalCreditsAwarded: 0,
    };
  }

  return awardMilestoneCredits(
    clerkUserId,
    "profile_complete",
    { email, phone },
    { providerType, providerId },
  );
}

export async function getCreditRewardsInfo(clerkUserId: string) {
  try {
    const record = await getCreditRewardRecord(clerkUserId);

    if (!record) {
      return {
        success: true,
        data: {
          awardedMilestones: {},
          totalCreditsAwarded: 0,
          maxWelcomeCredits: MAX_WELCOME_CREDITS,
          creditValueKsh: CREDIT_VALUE_KSH,
        },
      };
    }

    return {
      success: true,
      data: {
        awardedMilestones: record.awardedMilestones,
        totalCreditsAwarded: record.totalCreditsAwarded,
        maxWelcomeCredits: MAX_WELCOME_CREDITS,
        creditValueKsh: CREDIT_VALUE_KSH,
        providerType: record.providerType,
        providerId: record.providerId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    };
  } catch (error: any) {
    console.error("Error fetching credit rewards info:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch credit rewards",
    };
  }
}

export async function getTotalWelcomeCreditsAwarded(
  clerkUserId: string,
): Promise<number> {
  const record = await getCreditRewardRecord(clerkUserId);
  if (!record) return 0;
  return record.totalCreditsAwarded;
}
