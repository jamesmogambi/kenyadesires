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