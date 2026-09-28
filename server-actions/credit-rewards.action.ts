"use server";

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
import { executeQuery, executeQueryOne } from "@/lib/neon";
import { v4 as uuidv4 } from "uuid";

// ============================================
// Campaign 02 — Agency Acquisition Credit Rewards
// ============================================
// These rewards are idempotent: the agency_credit_rewards table
// has a UNIQUE constraint on (agency_id, reward_type) so the same
// reward can never be awarded twice even on duplicate calls.

const AGENCY_CREDIT_REWARDS = {
  REGISTRATION: {
    type: "agency_registration_reward",
    credits: 100,
    label: "Agency Registration",
    description: "Agency successfully creates an account.",
  },
  VERIFICATION: {
    type: "agency_verification_reward",
    credits: 200,
    label: "Agency Verification",
    description: "Agency successfully completes the required verification (approved only).",
  },
} as const;

type AgencyRewardType = "agency_registration_reward" | "agency_verification_reward";

interface AgencyCreditRewardRow {
  id: string;
  agency_id: string;
  reward_type: string;
  credits: number;
  description: string;
  created_at: Date;
}

/**
 * Award the agency registration reward (+100 credits).
 * Idempotent: checks agency_credit_rewards UNIQUE constraint.
 */
export async function awardAgencyRegistrationCredits(
  agencyId: string,
  agencyName: string,
  email: string,
): Promise<{ success: boolean; awarded: boolean; credits: number; error?: string }> {
  try {
    if (!agencyId) {
      return { success: false, awarded: false, credits: 0, error: "Missing agencyId" };
    }

    // Check if reward already awarded
    const existing = await executeQueryOne<AgencyCreditRewardRow>(
      `SELECT * FROM agency_credit_rewards WHERE agency_id = $1 AND reward_type = $2`,
      [agencyId, AGENCY_CREDIT_REWARDS.REGISTRATION.type],
    );

    if (existing) {
      return { success: true, awarded: false, credits: 0 };
    }

    // Insert reward record (UNIQUE constraint prevents duplicates)
    const rewardId = uuidv4();
    await executeQuery(
      `INSERT INTO agency_credit_rewards (id, agency_id, reward_type, credits, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        rewardId,
        agencyId,
        AGENCY_CREDIT_REWARDS.REGISTRATION.type,
        AGENCY_CREDIT_REWARDS.REGISTRATION.credits,
        `${AGENCY_CREDIT_REWARDS.REGISTRATION.description} Agency: ${agencyName}`,
      ],
    );

    // Update agency credits
    await executeQuery(
      `UPDATE agencies SET credits = COALESCE(credits, 0) + $1, updated_at = NOW() WHERE id = $2`,
      [AGENCY_CREDIT_REWARDS.REGISTRATION.credits, agencyId],
    );

    revalidatePath("/administration");
    revalidatePath("/agency-profile");

    return {
      success: true,
      awarded: true,
      credits: AGENCY_CREDIT_REWARDS.REGISTRATION.credits,
    };
  } catch (error: any) {
    console.error("Error awarding agency registration credits:", error);
    return {
      success: false,
      awarded: false,
      credits: 0,
      error: error?.message || "Failed to award registration credits",
    };
  }
}

/**
 * Award the agency verification reward (+200 credits).
 * Idempotent: checks agency_credit_rewards UNIQUE constraint.
 */
export async function awardAgencyVerificationCredits(
  agencyId: string,
  agencyName: string,
  email: string,
): Promise<{ success: boolean; awarded: boolean; credits: number; error?: string }> {
  try {
    if (!agencyId) {
      return { success: false, awarded: false, credits: 0, error: "Missing agencyId" };
    }

    // Check if reward already awarded
    const existing = await executeQueryOne<AgencyCreditRewardRow>(
      `SELECT * FROM agency_credit_rewards WHERE agency_id = $1 AND reward_type = $2`,
      [agencyId, AGENCY_CREDIT_REWARDS.VERIFICATION.type],
    );

    if (existing) {
      return { success: true, awarded: false, credits: 0 };
    }

    // Insert reward record (UNIQUE constraint prevents duplicates)
    const rewardId = uuidv4();
    await executeQuery(
      `INSERT INTO agency_credit_rewards (id, agency_id, reward_type, credits, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        rewardId,
        agencyId,
        AGENCY_CREDIT_REWARDS.VERIFICATION.type,
        AGENCY_CREDIT_REWARDS.VERIFICATION.credits,
        `${AGENCY_CREDIT_REWARDS.VERIFICATION.description} Agency: ${agencyName}`,
      ],
    );

    // Update agency credits
    await executeQuery(
      `UPDATE agencies SET credits = COALESCE(credits, 0) + $1, updated_at = NOW() WHERE id = $2`,
      [AGENCY_CREDIT_REWARDS.VERIFICATION.credits, agencyId],
    );

    revalidatePath("/administration");
    revalidatePath("/agency-profile");

    return {
      success: true,
      awarded: true,
      credits: AGENCY_CREDIT_REWARDS.VERIFICATION.credits,
    };
  } catch (error: any) {
    console.error("Error awarding agency verification credits:", error);
    return {
      success: false,
      awarded: false,
      credits: 0,
      error: error?.message || "Failed to award verification credits",
    };
  }
}

// ============================================
// Existing Campaign 01 credit rewards
// (kept as stubs — existing behavior unchanged)
// ============================================

export async function awardAccountCreationCredits(
  _userId: string,
  _email: string,
  _phone: string,
  _providerType: string,
  _providerId: string,
): Promise<{ success: boolean; awarded: boolean }> {
  return { success: true, awarded: false };
}

export async function checkAndAwardProfileCompletion(
  _userId: string,
  _data: any,
  _providerType: string,
  _providerId: string,
): Promise<{ success: boolean; awarded: boolean }> {
  return { success: true, awarded: false };
}

export async function awardVerificationCredits(
  _userId: string,
  _email: string,
  _phone: string,
  _type: string,
  _id: string,
): Promise<{ success: boolean; awarded: boolean; credits: number }> {
  return { success: true, awarded: false, credits: 0 };
}

export async function getCreditRewardRecord(_userId: string) {
  return null;
}