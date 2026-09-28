/**
 * Database access for agency_leads table.
 */

import { executeQuery, executeQueryOne } from "@/lib/neon";
import { v4 as uuidv4 } from "uuid";

export interface AgencyLeadRow {
  id: string;
  zoho_lead_id: string | null;
  agency_id: string | null;
  agency_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  location: string | null;
  estimated_profiles: number | null;
  profiles_listed: number;
  interested_package: string | null;
  lead_source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  utm_id: string | null;
  utm_source_platform: string | null;
  landing_page: string | null;
  campaign: string;
  first_touch_at: Date | null;
  zoho_status: string;
  zoho_error: string | null;
  zoho_contact_id: string | null;
  converted_to_contact: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAgencyLeadInput {
  agency_id?: string;
  agency_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  location?: string;
  estimated_profiles?: number;
  profiles_listed?: number;
  interested_package?: string;
  lead_source?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  utm_id?: string;
  utm_source_platform?: string;
  landing_page?: string;
  campaign?: string;
  first_touch_at?: Date;
}

export async function createAgencyLead(
  input: CreateAgencyLeadInput,
): Promise<AgencyLeadRow> {
  const id = uuidv4();
  const campaign = input.campaign || "agency_acquisition";

  await executeQuery(
    `INSERT INTO agency_leads (
      id, agency_id, agency_name, contact_person, email, phone, mobile,
      location, estimated_profiles, profiles_listed, interested_package,
      lead_source, utm_source, utm_medium, utm_campaign, utm_content,
      utm_term, utm_id, utm_source_platform, landing_page, campaign,
      first_touch_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
      $16, $17, $18, $19, $20, $21, $22
    )`,
    [
      id,
      input.agency_id || null,
      input.agency_name || null,
      input.contact_person || null,
      input.email || null,
      input.phone || null,
      input.mobile || null,
      input.location || null,
      input.estimated_profiles || null,
      input.profiles_listed || 0,
      input.interested_package || null,
      input.lead_source || null,
      input.utm_source || null,
      input.utm_medium || null,
      input.utm_campaign || null,
      input.utm_content || null,
      input.utm_term || null,
      input.utm_id || null,
      input.utm_source_platform || null,
      input.landing_page || null,
      campaign,
      input.first_touch_at || null,
    ],
  );

  const rows = await executeQuery<AgencyLeadRow>(
    `SELECT * FROM agency_leads WHERE id = $1`,
    [id],
  );
  return rows[0];
}

export async function updateAgencyLeadZohoStatus(
  leadId: string,
  zohoLeadId: string,
  zohoStatus: string,
  error?: string,
): Promise<void> {
  await executeQuery(
    `UPDATE agency_leads SET zoho_lead_id = $1, zoho_status = $2, zoho_error = $3, updated_at = NOW()
     WHERE id = $4`,
    [zohoLeadId, zohoStatus, error ?? null, leadId],
  );
}

export async function updateAgencyLeadContactId(
  leadId: string,
  zohoContactId: string,
): Promise<void> {
  await executeQuery(
    `UPDATE agency_leads SET zoho_contact_id = $1, converted_to_contact = TRUE, updated_at = NOW()
     WHERE id = $2`,
    [zohoContactId, leadId],
  );
}

export async function findAgencyLeadByEmail(
  email: string,
): Promise<AgencyLeadRow | null> {
  const rows = await executeQuery<AgencyLeadRow>(
    `SELECT * FROM agency_leads WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

export async function findAgencyLeadByAgencyId(
  agencyId: string,
): Promise<AgencyLeadRow | null> {
  const rows = await executeQuery<AgencyLeadRow>(
    `SELECT * FROM agency_leads WHERE agency_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [agencyId],
  );
  return rows[0] || null;
}