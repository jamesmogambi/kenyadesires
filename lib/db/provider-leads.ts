/**
 * Database access for provider_leads table.
 */

import { executeQuery, executeQueryOne, executeTransaction } from "@/lib/neon";
import { v4 as uuidv4 } from "uuid";

export interface ProviderLeadRow {
  id: string;
  zoho_lead_id: string | null;
  first_name: string;
  last_name: string;
  alias: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  secondary_email: string | null;
  telegram: string | null;
  twitter: string | null;
  city: string | null;
  county: string | null;
  consent_whatsapp: boolean;
  consent_email: boolean;
  age_confirmed: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  click_id: string | null;
  referral_code: string | null;
  ga_client_id: string | null;
  landing_url: string | null;
  consent_date: Date | null;
  lead_source: string | null;
  tier: string | null;
  description: string | null;
  zoho_status: string;
  zoho_error: string | null;
  converted_to_contact: boolean;
  zoho_contact_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProviderLeadInput {
  first_name: string;
  last_name: string;
  alias?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  secondary_email?: string;
  telegram?: string;
  twitter?: string;
  city?: string;
  county?: string;
  consent_whatsapp: boolean;
  consent_email: boolean;
  age_confirmed: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  click_id?: string;
  referral_code?: string;
  ga_client_id?: string;
  landing_url?: string;
  consent_date?: Date;
  lead_source?: string;
  tier?: string;
  description?: string;
}

export async function createProviderLead(
  input: CreateProviderLeadInput,
): Promise<ProviderLeadRow> {
  const id = uuidv4();
  const consentDate = input.consent_date || new Date();

  const rows = await executeQuery<ProviderLeadRow>(
    `INSERT INTO provider_leads (
      id, first_name, last_name, alias, phone, mobile, email, secondary_email,
      telegram, twitter, city, county, consent_whatsapp, consent_email, age_confirmed,
      utm_source, utm_medium, utm_campaign, click_id, referral_code, ga_client_id,
      landing_url, consent_date, lead_source, tier, description
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
    )
    RETURNING *`,
    [
      id,
      input.first_name,
      input.last_name,
      input.alias || null,
      input.phone || null,
      input.mobile || null,
      input.email || null,
      input.secondary_email || null,
      input.telegram || null,
      input.twitter || null,
      input.city || null,
      input.county || null,
      input.consent_whatsapp,
      input.consent_email,
      input.age_confirmed,
      input.utm_source || null,
      input.utm_medium || null,
      input.utm_campaign || null,
      input.click_id || null,
      input.referral_code || null,
      input.ga_client_id || null,
      input.landing_url || null,
      consentDate,
      input.lead_source || null,
      input.tier || null,
      input.description || null,
    ],
  );

  return rows[0];
}

export async function findProviderLeadByEmail(
  email: string,
): Promise<ProviderLeadRow | null> {
  return executeQueryOne<ProviderLeadRow>(
    `SELECT * FROM provider_leads WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [email],
  );
}

export async function findProviderLeadByClickId(
  clickId: string,
): Promise<ProviderLeadRow | null> {
  return executeQueryOne<ProviderLeadRow>(
    `SELECT * FROM provider_leads WHERE click_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [clickId],
  );
}

export async function findProviderLeadById(
  id: string,
): Promise<ProviderLeadRow | null> {
  return executeQueryOne<ProviderLeadRow>(
    `SELECT * FROM provider_leads WHERE id = $1`,
    [id],
  );
}

export async function findProviderLeadById(
  id: string,
): Promise<ProviderLeadRow | null> {
  return executeQueryOne<ProviderLeadRow>(
    `SELECT * FROM provider_leads WHERE id = $1`,
    [id],
  );
}

export async function updateProviderLeadZoho(
  providerLeadId: string,
  updates: {
    zoho_lead_id?: string;
    zoho_status?: string;
    zoho_error?: string;
    converted_to_contact?: boolean;
    zoho_contact_id?: string;
  },
): Promise<ProviderLeadRow | null> {
  const fields: string[] = [];
  const params: any[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = $${idx}`);
    params.push(value);
    idx++;
  }

  if (fields.length === 0) return null;

  params.push(providerLeadId);
  return executeQueryOne<ProviderLeadRow>(
    `UPDATE provider_leads SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
    params,
  );
}

export async function updateProviderLeadDescription(
  providerLeadId: string,
  append: string,
): Promise<ProviderLeadRow | null> {
  return executeQueryOne<ProviderLeadRow>(
    `UPDATE provider_leads
     SET description = CONCAT(COALESCE(description, ''), $1)
     WHERE id = $2
     RETURNING *`,
    [append, providerLeadId],
  );
}