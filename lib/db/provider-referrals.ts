/**
 * Database access for provider_referrals table.
 */

import { executeQuery, executeQueryOne } from "@/lib/neon";
import { v4 as uuidv4 } from "uuid";

export type ReferralStatus =
  | "pending"
  | "registered"
  | "verified"
  | "rewarded";

export interface ProviderReferralRow {
  id: string;
  referrer_lead_id: string | null;
  referrer_zoho_id: string | null;
  referral_code: string;
  referred_lead_id: string | null;
  referred_zoho_id: string | null;
  status: ReferralStatus;
  reward_credits: number;
  reward_amount_ksh: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReferralInput {
  referrer_lead_id?: string;
  referrer_zoho_id?: string;
  referral_code: string;
  referred_lead_id?: string;
  referred_zoho_id?: string;
}

export async function createReferral(
  input: CreateReferralInput,
): Promise<ProviderReferralRow> {
  const id = uuidv4();
  const rows = await executeQuery<ProviderReferralRow>(
    `INSERT INTO provider_referrals (
      id, referrer_lead_id, referrer_zoho_id, referral_code,
      referred_lead_id, referred_zoho_id, status
    ) VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    RETURNING *`,
    [
      id,
      input.referrer_lead_id ?? null,
      input.referrer_zoho_id ?? null,
      input.referral_code,
      input.referred_lead_id ?? null,
      input.referred_zoho_id ?? null,
    ],
  );
  return rows[0];
}

export async function findReferralByCode(
  referralCode: string,
): Promise<ProviderReferralRow | null> {
  return executeQueryOne<ProviderReferralRow>(
    `SELECT * FROM provider_referrals WHERE referral_code = $1 LIMIT 1`,
    [referralCode],
  );
}

export async function findReferralByReferredLeadId(
  referredLeadId: string,
): Promise<ProviderReferralRow | null> {
  return executeQueryOne<ProviderReferralRow>(
    `SELECT * FROM provider_referrals WHERE referred_lead_id = $1 LIMIT 1`,
    [referredLeadId],
  );
}

export async function updateReferralStatus(
  id: string,
  status: ReferralStatus,
  extra?: {
    referred_zoho_id?: string;
    referrer_zoho_id?: string;
    reward_credits?: number;
    reward_amount_ksh?: number;
  },
): Promise<ProviderReferralRow | null> {
  const fields: string[] = ["status = $2"];
  const params: any[] = [id, status];
  let idx = 3;

  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      fields.push(`${key} = $${idx}`);
      params.push(value);
      idx++;
    }
  }

  return executeQueryOne<ProviderReferralRow>(
    `UPDATE provider_referrals SET ${fields.join(", ")} WHERE id = $1 RETURNING *`,
    params,
  );
}

export async function findReferralsByReferrerLeadId(
  referrerLeadId: string,
): Promise<ProviderReferralRow[]> {
  return executeQuery<ProviderReferralRow>(
    `SELECT * FROM provider_referrals
     WHERE referrer_lead_id = $1
     ORDER BY created_at DESC`,
    [referrerLeadId],
  );
}