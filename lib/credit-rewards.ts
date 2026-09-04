export type MilestoneId = "account_created" | "profile_complete" | "verified";

export interface RewardMilestone {
  id: MilestoneId;
  credits: number;
  label: string;
  description: string;
}

export const CREDIT_REWARDS: Record<MilestoneId, RewardMilestone> = {
  account_created: {
    id: "account_created",
    credits: 10,
    label: "Create Account",
    description: "Provider successfully creates an account.",
  },
  profile_complete: {
    id: "profile_complete",
    credits: 20,
    label: "Complete Profile",
    description:
      "Provider reaches the platform's defined profile-completion threshold.",
  },
  verified: {
    id: "verified",
    credits: 50,
    label: "Verify Profile",
    description:
      "Provider successfully completes the verification process (approved only).",
  },
} as const;

export const MAX_WELCOME_CREDITS = 100;
export const CREDIT_VALUE_KSH = 10;
export const MAX_WELCOME_VALUE_KSH = MAX_WELCOME_CREDITS * CREDIT_VALUE_KSH;

export const TOTAL_WELCOME_REWARDS =
  CREDIT_REWARDS.account_created.credits +
  CREDIT_REWARDS.profile_complete.credits +
  CREDIT_REWARDS.verified.credits;

export const PROVIDER_TYPES = ["escort", "agency"] as const;
export type ProviderType = (typeof PROVIDER_TYPES)[number];

export interface AwardedMilestone {
  awarded: boolean;
  awardedAt: Date | null;
  credits: number;
}

export interface CreditRewardRecord {
  clerkUserId: string;
  email: string;
  phone: string;
  providerType: ProviderType;
  providerId: string;
  awardedMilestones: Record<MilestoneId, AwardedMilestone>;
  totalCreditsAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ESCORT_PROFILE_COMPLETION_FIELDS = [
  "name",
  "email",
  "previewPhoto",
  "images",
  "about",
  "county",
  "primaryRegion",
  "categories",
  "languages",
  "age",
] as const;

export const AGENCY_PROFILE_COMPLETION_FIELDS = [
  "name",
  "contactEmail",
  "county",
  "region",
  "businessType",
] as const;
