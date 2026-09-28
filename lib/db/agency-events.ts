/**
 * Database access for agency_events audit table.
 */

import { executeQuery } from "@/lib/neon";
import { v4 as uuidv4 } from "uuid";

export type AgencyEventType =
  | "registration"
  | "verification_started"
  | "verification_complete"
  | "profile_added"
  | "profile_published"
  | "profile_3"
  | "profile_5"
  | "profile_10"
  | "purchase";

export interface AgencyEventRow {
  id: string;
  agency_lead_id: string | null;
  zoho_entity_id: string | null;
  agency_id: string | null;
  event_type: string;
  event_data: any;
  zoho_updated: boolean;
  zoho_error: string | null;
  created_at: Date;
}

export interface CreateAgencyEventInput {
  agency_lead_id?: string;
  zoho_entity_id?: string;
  agency_id?: string;
  event_type: AgencyEventType;
  event_data?: any;
}

export async function createAgencyEvent(
  input: CreateAgencyEventInput,
): Promise<AgencyEventRow> {
  const id = uuidv4();
  await executeQuery(
    `INSERT INTO agency_events (
      id, agency_lead_id, zoho_entity_id, agency_id, event_type, event_data
    ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      id,
      input.agency_lead_id ?? null,
      input.zoho_entity_id ?? null,
      input.agency_id ?? null,
      input.event_type,
      JSON.stringify(input.event_data || {}),
    ],
  );

  const rows = await executeQuery<AgencyEventRow>(
    `SELECT * FROM agency_events WHERE id = $1`,
    [id],
  );
  return rows[0];
}

export async function updateAgencyEventZohoStatus(
  eventId: string,
  updated: boolean,
  error?: string,
): Promise<void> {
  await executeQuery(
    `UPDATE agency_events SET zoho_updated = $2, zoho_error = $3
     WHERE id = $1`,
    [eventId, updated, error ?? null],
  );
}